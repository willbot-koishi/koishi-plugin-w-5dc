import ChessRenderer from '5d-chess-renderer'
import Chess, { Variant } from '5d-chess-js'
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

    var cr: ChessRenderer
    var chess: Chess
}

const rootEl = document.getElementById('root')!
window.cr = new ChessRenderer()
cr.global.attach(rootEl)

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

async function doStart(input: string, variant: Variant) {
    window.chess = new Chess(input)
    chess.reset(variant)
    chess.skipDetection = true
    cr.global.sync(chess)

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
    doStart, doMove, doZoomPresent, doZoomFullBoard
})