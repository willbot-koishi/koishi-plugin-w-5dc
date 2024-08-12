declare module '5d-chess-js' {
    export type VariantName = 'standard'| 'defended_pawn'| 'half_reflected'| 'princess'| 'turn_zero'| 'two_timelines'| 'reversed_royalty'| 'custom'

    export type Variant = VariantName | object

    export default class Chess {
        public checkmateTimeout: number
        public skipDetection: boolean
        public enableConsole: boolean
        public raw: {
            metadataFuncs: MetadataFuncs
        }

        constructor(input?: string, variant?: Variant)

        public move(input: string): void
        public submit(): void

        public reset(variant: Variant): void

        public import(input: string, variant?: Variant, actionsRequired?: boolean): void
        public export(format: 'raw'): any[]
        public export(format: 'object'): any[]
        public export(format: 'json'): string
        public export(format: '5dpgn'): string
    }

    export type MetadataFuncs = {
        lookupVariant: (variantPrettyStr: string) => string
        lookupVariantFull: (variant: string) => string
    }
}