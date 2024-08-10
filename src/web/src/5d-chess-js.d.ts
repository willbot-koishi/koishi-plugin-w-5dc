declare module '5d-chess-js' {
    export type VariantName = 'standard'| 'defended_pawn'| 'half_reflected'| 'princess'| 'turn_zero'| 'two_timelines'| 'reversed_royalty'| 'custom'

    export default class Chess {
        public checkmateTimeout: number
        public skipDetection: boolean
        public enableConsole: boolean

        constructor(input?: string, variant?: VariantName | object)

        public move(input: string): void
        public submit(): void
    }
}