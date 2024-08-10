import ChessRenderer from '5d-chess-renderer'
import Chess from '5d-chess-js'
import type { ISnapZoomOptions } from 'pixi-viewport'

declare global {
    interface Window {
        cr: ChessRenderer
        chess: Chess

        doStart: typeof doStart
        doMove: typeof doMove
        doZoomPresent: typeof doZoomPresent
        doZoomFullBoard: typeof doZoomFullBoard
    }
}

const rootEl = document.getElementById('root')!
const cr = new ChessRenderer(rootEl)
cr.global.attach(rootEl)

const chess = new Chess()
chess.skipDetection = true
cr.global.sync(chess)

void function hookSnapZoom() {
    const { viewport } = cr.zoom
    const snapZoom = viewport.snapZoom.bind(viewport)
    viewport.snapZoom = (option: ISnapZoomOptions) => snapZoom({ ...option, forceStart: true })
} ()

async function doZoomPresent() {
    cr.zoom.present(true, 1.5)

    await new Promise(res => {
        cr.zoom.viewport.once('snap-zoom-end', res)
    })
}

async function doZoomFullBoard() {
    cr.zoom.fullBoard()

    await new Promise(res => {
        cr.zoom.viewport.once('snap-zoom-end', res)
    })
}

async function doStart() {
    await doZoomPresent()
}

async function doMove(input: string): Promise<string | null> {
    try {
        chess.move(input)
        chess.submit()
        cr.global.sync(chess)
        await doZoomPresent()
        return null
    }
    catch (error) {
        if (error instanceof Error) return error.message
        return String(error)
    }
}

Object.assign(window, {
    cr, chess,
    doStart, doMove, doZoomPresent, doZoomFullBoard
})