import path from 'path'
import { h, Context, Schema, Session, SessionError } from 'koishi'
import {} from 'koishi-plugin-puppeteer'
import type { Page } from 'puppeteer-core'
import {} from './web/src/main'
import Chess, { Variant } from '5d-chess-js'

export const name = 'w-5dc'

export const inject = [ 'puppeteer', 'database' ]

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export type Game = {
    page: Page
    size: {
        width: number
        height: number
    }
}

export function apply(ctx: Context) {
    const games: Record<string, Game> = {}

    const chess = new Chess

    const getGameId = (session: Session): string => {
        return session.guildId ?? ('#' + session.userId)
    }

    const getGame = (session: Session): Game | undefined => {
        return games[getGameId(session)]
    }

    const tryGetGame = (session: Session): Game => {
        const game = games[getGameId(session)]
        if (! game) throw new SessionError('当前没有对局，请先调用 5dc.start 创建对局')
        return game
    }

    const createGame = async (pageId: string, input: string, variant: string): Promise<Game> => {
        const page = await ctx.puppeteer.browser.newPage()
        await page.goto(`file://${path.join(__dirname, 'web/dist/index.html')}`)
        await page.evaluate(
            (input, variant) => window.doStart(input, variant),
            input, variant as Variant
        )
        const game = games[pageId] = {
            page,
            size: {
                width: 1600,
                height: 1200
            }
        }
        return game
    }

    const sleep = async (t: number) => new Promise(res => setTimeout(res, t))

    const MIN_BYTELENGTH_PER_PIXEL = 1 / 48 // Todo: make this more reasonable
    let lastScreen: Buffer | null = null
    const shot = async ({ page, size }: Game) => {
        const body = await page.$('body')
        const minByteLength = size.height * size.width * MIN_BYTELENGTH_PER_PIXEL

        while (true) {
            lastScreen = await body.screenshot()
            if (lastScreen.byteLength < minByteLength) {
                await sleep(500)
                continue
            }
            return h.image(lastScreen, 'image/png')
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
        const id = getGameId(session)
        if (games[id] && ! override) return '有对局正在进行，如需覆盖导入请使用 --override 选项'
        
        const variantName = tryGetVariantName(variant)
        session.send(`正在创建变体为 ${variant} (${variantName}) 的对局……`)

        const game = await createGame(id, input ?? '', variant)
        const { page } = game

        if (full) await fullScreen(game)

        return shot(game)
    }
    
    const fullScreen = async (game: Game) => {
        const { page } = game

        const size = game.size = await page.evaluate(
            () => window.cr.raw.positionFuncs.toWorldBorders(cr.global)
        )

        await game.page.evaluate(({ width, height }) => {
            window.doResizeCanvas(width, height)
        }, size)
    }

    ctx.command('5dc.start', '创建 5dc 对局')
        .option('override', '-o')
        .option('full', '-f')
        .option('variant', '-v <variant: string>', { fallback: 'turn_zero' })
        .action(start)


    ctx.command('5dc.show', '查看当前 5dc 对局')
        .option('full', '-f')
        .action(async ({ session, options }) => {
            const game = tryGetGame(session)

            if (options.full) fullScreen(game)

            return shot(game)
        })

    ctx.command('5dc.move', '在当前 5dc 对局中落子')
        .option('full', '-f')
        .action(async ({ session, options }, input) => {
            const game = tryGetGame(session)
            const { page } = game

            const error = await page.evaluate(input => window.doMove(input), input)
            if (error) return error

            if (options.full) await fullScreen(game)

            return shot(game)
        })


    ctx.command('5dc.export', '导出当前 5dc 对局')
        .option('format', '-F <format: string>', { fallback: '5dpgn' })
        .action(async ({ session, options }) => {
            const game = tryGetGame(session)
            const { page } = game

            return await page.evaluate(format => window.chess.export(format), options.format)
        })

    ctx.command('5dc.import <input: text>', '导入 5dc 棋局')
        .option('override', '-o')
        .option('full', '-f')
        .option('variant', '-v <variant: string>', { fallback: 'turn_zero' })
        .action(start)

    ctx.command('5dc.list', '显示当前所有 5dc 对局')
        .action(() => {
            const pageIds = Object.keys(games)
            const pageNum = pageIds.length
            return pageNum
                ? `当前共有 ${pageNum} 个对局：${ pageIds.map(s => `'${s}'`).join(', ') }`
                : '当前没有对局'
        })

    const endAll = () => {
        let endedNum = 0
        for (const id in games) {
            if (games[id]) {
                games[id].page.close()
                delete games[id]
                endedNum ++
            }
        }
        return endedNum
    }

    ctx.command('5dc.end', '结束当前 5dc 对局')
        .option('all', '-a', { permissions: [ 'authority:3' ] })
        .action(({ session, options }) => {
            if (! options.all) {
                const id = getGameId(session)
                if (games[id]) {
                    games[id].page.close()
                    delete games[id]
                    return `已结束对局 '${id}'`
                }
                return '当前没有对局'
            }

            const endedNum = endAll()
            return `已结束全部 ${endedNum} 个对局`
        })

    ctx.command('5dc.debug.screen')
        .action(() => {
            ctx.logger.info(lastScreen)
        })

    ctx.on('dispose', () => {
        const endedNum = endAll()
        ctx.logger.info(`Ended ${endedNum} game(s).`)
    })
}
