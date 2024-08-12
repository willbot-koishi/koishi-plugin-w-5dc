import path from 'path'
import { h, Context, Schema, Session, SessionError } from 'koishi'
import {} from 'koishi-plugin-puppeteer'
import type { Page } from 'puppeteer-core'
import {} from './web/src/main'
import { Variant, default as Chess } from '5d-chess-js'

export const name = 'w-5dc'

export const inject = [ 'puppeteer' ]

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
    const pages: Record<string, Page> = {}

    const chess = new Chess

    const getPageId = (session: Session): string => {
        return session.guildId ?? ('#' + session.userId)
    }

    const getPage = (session: Session): Page | undefined => {
        return pages[getPageId(session)]
    }

    const createPage = async (pageId: string, input: string, variant: string) => {
        const newPage = pages[pageId] = await ctx.puppeteer.browser.newPage()
        await newPage.goto(`file://${path.join(__dirname, 'web/dist/index.html')}`)
        await newPage.evaluate(
            (input, variant) => window.doStart(input, variant),
            input, variant as Variant
        )
        return newPage
    }

    const sleep = async (t: number) => new Promise(res => setTimeout(res, t))

    let screen: Buffer | null = null
    const MIN_SCREEN_BYTELENGTH = 40000
    const shot = async (page: Page) => {
        const body = await page.$('body')
        while (true) {
            screen = await body.screenshot()
            if (screen.byteLength < MIN_SCREEN_BYTELENGTH) {
                await sleep(500)
                continue
            }
            return h.image(screen, 'image/png')
        }
    }

    const tryGetVariantName = (variant: string): string => {
        const fullName = chess.raw.metadataFuncs.lookupVariantFull(variant)
        if (! fullName) throw new SessionError(`未知的变体 ${variant}`)
        return fullName
    }

    const start = async (
        { session, options: { override, full, variant } }: {
            session: Session,
            options: { override: boolean, full: boolean, variant: string }
        },
        input?: string
    ) => {
        const pageId = getPageId(session)
        if (pages[pageId] && ! override) return '有对局正在进行，如需覆盖导入请使用 --override 选项'
        
        const variantName = tryGetVariantName(variant)
        session.send(`正在创建变体为 ${variant} (${variantName}) 的对局……`)
        const page = await createPage(pageId, input ?? '', variant)

        if (full) await page.evaluate(() => window.doZoomFullBoard())

        return shot(page)
    }
        

    ctx.command('5dc.start', '创建 5dc 对局')
        .option('override', '-o')
        .option('full', '-f')
        .option('variant', '-v <variant: string>', { fallback: 'turn_zero' })
        .action(start)


    ctx.command('5dc.show', '查看当前 5dc 对局')
        .option('full', '-f')
        .action(async ({ session, options }) => {
            const page = getPage(session)
            if (! page) return '当前没有对局，请先调用 5dc.start 创建对局'

            if (options.full) await page.evaluate(() => window.doZoomFullBoard())

            return shot(page)
        })

    ctx.command('5dc.move', '在当前 5dc 对局中落子')
        .option('full', '-f')
        .action(async ({ session, options }, input) => {
            const page = getPage(session)
            if (! page) return '当前没有对局，请先调用 5dc.start 创建对局'

            const error = await page.evaluate(input => window.doMove(input), input)
            if (error) return error

            if (options.full) await page.evaluate(() => window.doZoomFullBoard())

            return shot(page)
        })


    ctx.command('5dc.export', '导出当前 5dc 对局')
        .option('format', '-F <format: string>', { fallback: '5dpgn' })
        .action(async ({ session, options }) => {
            const page = getPage(session)
            if (! page) return '当前没有对局，请先调用 5dc.start 创建对局'

            return await page.evaluate(format => window.chess.export(format), options.format)
        })

    ctx.command('5dc.import <input: text>', '导入 5dc 棋局')
        .option('override', '-o')
        .option('full', '-f')
        .option('variant', '-v <variant: string>')
        .action(start)

    ctx.command('5dc.list', '显示当前所有 5dc 对局')
        .action(() => {
            const pageIds = Object.keys(pages)
            const pageNum = pageIds.length
            return pageNum
                ? `当前共有 ${pageNum} 个对局：${ pageIds.map(s => `'${s}'`).join(', ') }`
                : '当前没有对局'
        })

    const endAll = () => {
        let endedNum = 0
        for (const pageId in pages) {
            if (pages[pageId]) {
                pages[pageId].close()
                delete pages[pageId]
                endedNum ++
            }
        }
        return endedNum
    }

    ctx.command('5dc.end', '结束当前 5dc 对局')
        .option('all', '-a', { permissions: [ 'authority:3' ] })
        .action(({ session, options }) => {
            if (! options.all) {
                const pageId = getPageId(session)
                if (pages[pageId]) {
                    pages[pageId].close()
                    delete pages[pageId]
                    return `已结束对局 '${pageId}'`
                }
                return '当前没有对局'
            }

            const endedNum = endAll()
            return `已结束全部 ${endedNum} 个对局`
        })

    ctx.command('5dc.debug.lastscreen')
        .action(() => {
            console.log(screen)
        })

    ctx.on('dispose', () => {
        endAll()
    })
}
