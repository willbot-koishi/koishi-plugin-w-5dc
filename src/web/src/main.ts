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
        doResizeCanvas: typeof doResizeCanvas
        doResizeCanvasToFullBoard: typeof doResizeCanvasToFullBoard
    }

    var cr: ChessRenderer
    var chess: Chess
}

const body = document.body
const rootEl = document.getElementById('root')!

doCreateRenderer()

function doCreateRenderer() {
    window.cr = new ChessRenderer()
    cr.global.attach(rootEl)

    const { viewport } = cr.zoom
    const snapZoom = viewport.snapZoom.bind(viewport)
    viewport.snapZoom = (option: ISnapZoomOptions) => snapZoom({ ...option, forceStart: true })
}

function waitSnapZoomEnd() {
    return new Promise(res => cr.zoom.viewport.once('snap-zoom-end', res))
}

function sleep(t: number) {
    return new Promise(res => setTimeout(res, t))
}

async function doZoomPresent() {
    cr.zoom.present(true, 1.5)
    await waitSnapZoomEnd()    
}

async function doZoomFullBoard() {
    cr.zoom.fullBoard()
    await waitSnapZoomEnd()    
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

async function doResizeCanvas(width: number, height: number) {
    body.style.width = `${width}px`
    body.style.height = `${height}px`

    cr.destroy()

    doCreateRenderer()
    cr.global.sync(chess)

    await doZoomFullBoard()
}

function doResizeCanvasToFullBoard() {
    const { width, height } = cr.raw.positionFuncs.toWorldBorders(cr.global)
    return doResizeCanvas(width, height)
}

Object.assign(window, {
    sleep,
    doStart, doMove,
    doZoomPresent, doZoomFullBoard,
    doResizeCanvas, doResizeCanvasToFullBoard
})