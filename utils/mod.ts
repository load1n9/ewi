import {
  brightRed,
  cyan,
  green,
  magenta,
  yellow,
} from "https://deno.land/std@0.113.0/fmt/colors.ts";

// deno-lint-ignore no-explicit-any
export function toHexString(byteArray: any) {
  // deno-lint-ignore no-explicit-any
  return Array.from(byteArray, (byte: any) => {
    return ("0" + (byte & 0xFF).toString(16)).slice(-2);
  });
}
// deno-lint-ignore no-explicit-any
export function printFile(data: any) {
  console.log(brightRed(`
-----------------------------------------------
size: ${data.length}
-----------------------------------------------
`));
  for (let i = 0; i < data.length; i += 8) {
    let output = "";
    for (let j = 0; j < 8; j++) {
      // deno-lint-ignore no-explicit-any
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
// https://github.com/dingram/jsmidgen/blob/master/lib/jsmidgen.js
export class Utils {
  static midi_letter_pitches: {
    a: 21;
    b: 23;
    c: 12;
    d: 14;
    e: 16;
    f: 17;
    g: 19;
  };

  static letterToPitch(letter: string) {
    switch (letter) {
      case "a":
        return 21;
      case "b":
        return 23;
      case "c":
        return 12;
      case "d":
        return 14;
      case "e":
        return 16;
      case "f":
        return 17;
      case "g":
        return 19;
      default:
        return 0;
    }
  }
  static pitchToLetter(pitch: number): string {
    switch (pitch) {
      case 12:
        return "c";
      case 13:
        return "c#";
      case 14:
        return "d";
      case 15:
        return "d#";
      case 16:
        return "e";
      case 17:
        return "f";
      case 18:
        return "f#";
      case 19:
        return "g";
      case 20:
        return "g#";
      case 21:
        return "a";
      case 22:
        return "a#";
      case 23:
        return "b";
      default:
        return "";
    }
  }
  static flattenedNote(note: string): string {
    switch (note) {
      case "a#":
        return "bb";
      case "c#":
        return "db";
      case "d#":
        return "eb";
      case "f#":
        return "gb";
      case "g#":
        return "ab";
      default:
        return note;
    }
  }
  static midiPitchFromNote(note: string): number {
    const letter = note.split("")[0];
    const octave = Number(note.split("")[1]);
    return Utils.letterToPitch(letter) + (octave * 12);
  }
  static midiEnsurePitch(pitch: number | string) {
    return typeof pitch === "number" || !/[^0-9]/.test(pitch) ? pitch : Utils.midiPitchFromNote(pitch);
  }
  static midiNoteFromPitch(note: number, returnFlattened = false) {
    let octave = 0;
    let noteNum = note;
    let noteName: string;
    if (note > 23) {
      octave = Math.floor(note/12) - 1;
      noteNum = note - octave * 12;
    }

    noteName = Utils.pitchToLetter(noteNum);
    if (returnFlattened && noteName.indexOf('#') > 0) {
      noteName = Utils.flattenedNote(noteName);
    }
    return noteName + octave;
  }

}
