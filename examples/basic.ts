
import { Parser } from '../mod.ts';

const parser = new Parser(Deno.readFileSync("./test.mid"));
console.log(parser.midi?.track[0].event)
