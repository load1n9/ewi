
import { Parser, Generator } from '../mod.ts';

const parser = new Parser(Deno.readFileSync("./test.mid"));
console.log(parser.midi?.track[0].event)


const generator = new Generator({tracks: [parser.midi!.track[0]]});
const midi = generator.write();
console.log(midi)