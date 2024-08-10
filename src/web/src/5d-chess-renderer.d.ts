declare module '5d-chess-renderer' {
    import type Chess from '5d-chess-js'
    import type * as NsPIXI from 'pixi.js-legacy'
    import type { Viewport } from 'pixi-viewport'
    import type { Emitter } from 'nanoevents'

    export type PIXI = typeof NsPIXI

    export default class ChessRenderer {
        public global: Global
        public zoom: ZoomManager

        constructor(
            customElement?: HTMLElement | null,
            customConfig?: DeepPartial<ConfigData> | null,
            customPalette?: PaletteData | null,
            customPIXI?: PIXI | null,
            customTexture?: TextureData | null
        )
    }

    export class Global {
        public PIXI: PIXI
        public app: PIXI.Application
        public emitter: Emitter
        public textureStore: Textures
        public configStore: Config
        public viewport: Viewport

        constructor(
            customConfig?: DeepPartial<ConfigData> | null,
            customPalette?: PaletteData | null,
            customPIXI?: PIXI | null,
            customTexture?: TextureData | null
        )

        public attach(element: HTMLElement): void

        public sync(chess: Chess): void
    }

    export class Store<T> {
        constructor(customData?: DeepPartial<T> | null)
        public set<K extends keyof T>(key: K, value: T[K]): void
        public get<K extends keyof T>(key: K): T[K]
    }

    export type TextureNames =
        | 'highlight' | 'whiteSquare' | 'blackSquare' | 'whiteBoardBorder' | 'blackBoardBorder' | 'checkBoardBorder' | 'inactiveBoardBorder'
        | 'blackP' | 'blackW' | 'blackB' | 'blackN' | 'blackR' | 'blackQ' | 'blackS' | 'blackK' | 'blackC' | 'blackY' | 'blackU' | 'blackD'
        | 'whiteP' | 'whiteW' | 'whiteB' | 'whiteN' | 'whiteR' | 'whiteS' | 'whiteQ' | 'whiteK' | 'whiteC' | 'whiteY' | 'whiteU' | 'whiteD'
    export type TextureSource = string | HTMLImageElement | HTMLCanvasElement | SVGElement | HTMLVideoElement
    export type TextureDict = Record<TextureNames, PIXI.BaseTexture>
    export type TextureData = Record<TextureNames, TextureSource>
    export class Textures extends Store<TextureData> {
        public PIXI: PIXI
        public textures: TextureDict

        constructor(
            PIXI: PIXI,
            customTexture?: TextureData | null
        )
    }


    export type DeepPartial<T> = T extends object ? {
        [P in keyof T]?: DeepPartial<T[P]>
    } : T
    

    export type ConfigData = {
        app: {
            height: number,                                             
            width: number,
            preserveDrawingBuffer: boolean,
            antialias: boolean,
            forceCanvas: boolean,
            backgroundAlpha: number,
            interactive: boolean,
        },
        viewport: {
            drag: boolean,
            dragOptions: {
                direction: string,
                pressDrag: boolean,
                wheel: boolean,
                wheelScroll: number,
                reverse: boolean,
                clampWheel: boolean,
                underflow: string,
                factor: number,
                mouseButtons: string,
            },
            pinch: boolean,
            pinchOptions: {
                noDrag: boolean,
                percent: number,
                factor: number,
            },
            wheel: boolean,
            wheelOptions: {
                percent: number,
                smooth: boolean,
                reverse: boolean,
            },
            decelerate: boolean,
            decelerateOptions: {
                friction: number,
                bounce: number,
                minSpeed: number,
            },
            bounce: boolean,
            bounceOptions: {
                sides: string,
                friction: number,
                time: number,
                ease: string,
                underflow: string,
            },
            clampZoom: boolean,
            clampZoomHeightFactor: number,
            clampZoomWidthFactor: number,
            snapOptions: {
                friction: number,
                time: number,
                ease: string,
            },
            snapZoomOptions: {
                time: number,
                ease: string,
            }
        },
        fps: {
            show: boolean,
            fpsTextOptions: {
                align: string,
                fontFamily: string,
                fontSize: number,
                fontStyle: string,
                fontWeight: string,
                textBaseline: string,
            },
            min: number,
            max: number,
        },
        stats: {
            show: boolean,
        },
        background: {
            showRectangle: boolean,
            blur: boolean,
            blurStrength: number,
            blurQuality: number,
            striped: boolean,
            stripeRatio: number,
            expandDuration: number,
        },
        board: {
            showWhite: boolean,
            showBlack: boolean,
            marginHeight: number,
            marginWidth: number,
            borderHeight: number,
            borderWidth: number,
            borderRadius: number,
            borderLineWidth: number,
            flipTimeline: boolean,
            flipTurn: boolean,
            flipRank: boolean,
            flipFile: boolean,
            slideBoard: boolean,
            fadeDuration: number,
            showGhost: boolean,
            ghostAlpha: number,
            showPresentBlink: boolean,
            blinkDuration: number,
        },
        boardLabel: {
            showTimeline: boolean,
            showMiddleTimeline: boolean,
            rotateTimelineLabel: boolean,
            timelineTextOptions: {
                align: string,
                fontFamily: string,
                fontSize: number,
                fontStyle: string,
                fontWeight: string,
                textBaseline: string,
            },
            showTurn: boolean,
            turnTextOptions: {
                align: string,
                fontFamily: string,
                fontSize: number,
                fontStyle: string,
                fontWeight: string,
                textBaseline: string,
            },
            showFile: boolean,
            fileTextOptions: {
                align: string,
                fontFamily: string,
                fontSize: number,
                fontStyle: string,
                fontWeight: string,
                textBaseline: string,
            },
            showRank: boolean,
            rankTextOptions: {
                align: string,
                fontFamily: string,
                fontSize: number,
                fontStyle: string,
                fontWeight: string,
                textBaseline: string,
            },
            fadeDuration: number,
        },
        boardShadow: {
            show: boolean,
            offsetX: number,
            offsetY: number,
            alpha: number,
        },
        promotion: {
            borderHeight: number,
            borderWidth: number,
            borderRadius: number,
            borderLineWidth: number,
            fadeDuration: number,
        },
        promotionShadow: {
            show: boolean,
            offsetX: number,
            offsetY: number,
            alpha: number,
        },
        square: {
            height: number,
            width: number,
            fadeDuration: number,
        },
        piece: {
            height: number,
            width: number,
            fadeDuration: number,
            roundPixel: boolean,
        },
        arrow: {
            lutInterval: number,
            headSize: number,
            size: number,
            midpointRadius: number,
            outlineSize: number,
            animateDuration: number,
            alpha: number,
            showSpatial: boolean,
            spatialCurved: boolean,
            spatialSplitCurve: boolean,
            spatialMiddle: boolean,
            spatialRealEnd: boolean,
            showNonSpatial: boolean,
            nonSpatialCurved: boolean,
            nonSpatialSplitCurve: boolean,
            nonSpatialMiddle: boolean,
            nonSpatialRealEnd: boolean,
            showCheck: boolean,
            checkCurved: boolean,
            showCustom: boolean,
            customCurved: boolean,
            customSplitCurve: boolean,
            customMiddleCurved: boolean,
            customMiddleSplitCurve: boolean,
        },
        highlight: {
            hoverAlpha: number,
            pastHoverAlpha: number,
            selectedAlpha: number,
            pastSelectedAlpha: number,
            fadeDuration: number,
        },
        ripple: {
            timelineDuration: number,
            turnDuration: number,
            rankDuration: number,
            fileDuration: number,
        },
        selector: {
            deselectOnMove: boolean,
        },
    }
    export class Config extends Store<ConfigData> {
        public config: ConfigData
    }

    export type PaletteData = {
        fps: {
            text: number,
        },
        background: {
            single: number,
            lightRectangle: number,
            lightStripeBlack: number,
            lightStripeWhite: number,
            lightStripePast: number,
            darkRectangle: number,
            darkStripeBlack: number,
            darkStripeWhite: number,
            darkStripePast: number,
        },
        board: {
            whiteBorder: number,
            blackBorder: number,
            checkBorder: number,
            inactiveBorder: number,
            whiteBorderOutline: number,
            blackBorderOutline: number,
            checkBorderOutline: number,
            inactiveBorderOutline: number,
        },
        boardLabel: {
            timeline: number,
            turn: number,
            whiteBoard: number,
            blackBoard: number,
            checkBoard: number,
            inactiveBoard: number,
        },
        boardShadow: {
            shadow: number,
        },
        square: {
            white: number,
            black: number,
        },
        arrow: {
            move: number,
            moveOutline: number,
            check: number,
            checkOutline: number,
            custom: number,
            customOutline: number,
        },
        highlight: {
            self: number,
            move: number,
            pastMove: number,
            capture: number,
            pastCapture: number,
        }
    }
    export class Palette extends Store<PaletteData> {
        public palette: Palette
    }

    export type Offset = {
        x: number
        y: number
        width: number
        height: number
    }

    export class ZoomManager {
        public viewport: Viewport

        constructor(global: Global)

        public present(move?: boolean, zoom?: boolean | number)
        public fullBoard(move?: boolean, zoom?: boolean | number, offset?: Offset | null)
    }   
}