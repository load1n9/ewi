import {
  brightRed,
  cyan,
  green,
  magenta,
  yellow,
} from "https://deno.land/std@0.113.0/fmt/colors.ts";

export function toHexString(byteArray: any) {
  return Array.from(byteArray, (byte: any) => {
    return ("0" + (byte & 0xFF).toString(16)).slice(-2);
  });
}

export function printFile(data: any) {
  console.log(brightRed(`
-----------------------------------------------
size: ${data.length}
-----------------------------------------------
`));
  for (let i = 0; i < data.length; i += 8) {
    let output = "";
    for (let j = 0; j < 8; j++) {
      let choice: any;

      switch (Math.floor(Math.random() * 4)) {
        case 0:
          choice = green;
          break;
        case 1:
          choice = cyan;
          break;
        case 2:
          choice = magenta;
          break;
        case 3:
          choice = yellow;
          break;
        default:
          choice = yellow;
          break;
      }
      if (data[i + j]) {
        output += choice(` [${data[i + j]}] `);
      }
    }
    console.log(output);
  }
}
