# Ewi
deno midi file parser
## Usage:
```ts

import { Parser } from 'https://deno.land/x/ewi/mod.ts';

const parser = new Parser(Deno.readFileSync("./test.mid"));
parser.print();
console.log(parser.midi);

```
based on [midi-parser-js](https://github.com/colxi/midi-parser-js)