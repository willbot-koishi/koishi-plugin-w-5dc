import path from 'path'
import { h, Context, Schema, Session } from 'koishi'
import {} from 'koishi-plugin-puppeteer'
import type { Page } from 'puppeteer-core'
import {} from './web/src/main'

export const name = 'w-5dc'

export const inject = [ 'puppeteer' ]

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
    const pages: Record<string, Page> = {}

    const getPageId = (session: Session): string => {
        return session.guildId ?? ('#' + session.userId)
    }

    const getPage = (session: Session): Page | undefined => {
        return pages[getPageId(session)]
    }

    const _withMinTime = async <T>(promise: Promise<T>, minTime: number) => (
        (await Promise.all([
            promise,
            sleep(minTime)
        ]))[0]
    )

    const getPageOrCreate = async (session: Session, forceCreate = false): Promise<Page> => {
        const pageId = getPageId(session)
        const page = pages[pageId]
        if (! forceCreate && page) return page
        if (page) page.close()
        
        session.send('正在创建对局……')
        const newPage = pages[pageId] = await ctx.puppeteer.browser.newPage()
        await newPage.goto(`file://${path.join(__dirname, 'web/dist/index.html')}`)
        await newPage.evaluate(() => window.doStart())
        return newPage
    }

    let lastScreen: Buffer | null = null

    const MIN_SCREEN_BYTELENGTH = 10000

    const shot = async (page: Page) => {
        const body = await page.$('body')
        while (true) {
            const screen = await body.screenshot()
            if (screen.byteLength < MIN_SCREEN_BYTELENGTH) {
                await sleep(500)
                continue
            }
            return h.image(screen, 'image/png')
        }
    }

    const sleep = async (t: number) => new Promise(res => setTimeout(res, t))

    ctx.command('5dc.show', '显示/创建 5dc 对局')
        .option('new', '-n')
        .option('full', '-f')
        .action(async ({ session, options }) => {
            const page = await getPageOrCreate(session, options.new)
            if (options.full) await page.evaluate(() => window.doZoomFullBoard())
            return shot(page)
        })

    ctx.command('5dc.move', '在当前 5dc 对局中落子')
        .action(async ({ session }, input) => {
            const page = getPage(session)
            if (! page) return '当前没有对局，请先调用 5dc.start 创建对局'

            const error = await page.evaluate(input => window.doMove(input), input)
            if (error) return error

            return shot(page)
        })

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
                return '当期没有对局'
            }

            const endedNum = endAll()
            return `已结束全部 ${endedNum} 个对局`
        })

    ctx.command('5dc.debug.lastscreen')
        .action(() => {
            console.log(lastScreen.toString())
        })

    ctx.on('dispose', () => {
        endAll()
    })
}
