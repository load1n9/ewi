export class Midi {
    constructor(
        // deno-lint-ignore no-explicit-any
        public formatType: any,
        // deno-lint-ignore no-explicit-any
        public tracks: any,
        // deno-lint-ignore no-explicit-any
        public track: any[],
        public timeDivision: number | number[]
    ) {

    }
}