import { printFile, toHexString } from "./../utils/mod.ts";
import { MIDIFile } from "./file.ts";
import { Midi } from "./midi.ts";

export class Parser {
  file: Uint8Array;
  data: MIDIFile;
  midi?: Midi;
  headerSize: number | undefined;
  constructor(file: Uint8Array) {
    this.file = file;
    this.data = new MIDIFile(
      new DataView(
        this.file.buffer,
        this.file.byteOffset,
        this.file.byteLength,
      ),
    );
    if (!this.isMidi()) {
      throw new Error("not this.midi file or it is corrupt");
    }
    this.setMidi();
    this.readTrack();
  }
  isMidi() {
    return this.data.readInt(4).toString(16) === "4d546864";
  }
  setMidi(): void {
    this.headerSize = this.data.readInt(4);
    const formatType = this.data.readInt(2);
    const tracks = this.data.readInt(2);
    const track: [] = [];
    const timeDivisionByte1 = this.data.readInt(1);
    const timeDivisionByte2 = this.data.readInt(1);
    let timeDivision: number | number[];
    if (timeDivisionByte1 >= 128) {
      timeDivision = [];
      timeDivision[0] = timeDivisionByte1 - 128;
      timeDivision[1] = timeDivisionByte2;
    } else {
      timeDivision = (timeDivisionByte1 * 256) + timeDivisionByte2;
    }
    this.midi = new Midi(
      formatType,
      tracks,
      track,
      timeDivision,
    );
  }
  readTrack() {
    if (this.midi === undefined) return;
    for (let t = 1; t <= this.midi.tracks; t++) {
      this.midi.track[t - 1] = { event: [] };
      const headerValidation = this.data.readInt(4);
      if (headerValidation === -1) break;
      if (headerValidation.toString(16) !== "4d54726b") {
        throw new Error("not this.midi file or it is corrupt");
      }
      this.data.readInt(4);
      let e = 0;
      let endOfTrack = false;
      let statusByte: number | string[] = 0;
      let laststatusByte;
      while (!endOfTrack) {
        e++;
        this.midi.track[t - 1].event[e - 1] = {};
        this.midi.track[t - 1].event[e - 1].deltaTime = this.data.readIntVLV();
        statusByte = this.data.readInt(1);
        if (statusByte === -1) {
          break;
        } else if (statusByte >= 128) {
          laststatusByte = statusByte;
        } else {
          statusByte = laststatusByte || 0;
          this.data.movePointer(-1);
        }

        if (statusByte?.toString(16) === "FF") {
          this.midi.track[t - 1].event[e - 1].type = "FF";
          const hmm = this.data.readInt(1);
          this.midi.track[t - 1].event[e - 1].metaType = hmm === -1
            ? hmm
            : hmm.toString(16);
          const metaEventLength = this.data.readIntVLV();
          switch (this.midi.track[t - 1].event[e - 1].metaType) {
            case "2F":
            case -1:
              endOfTrack = true;
              break;
            case "01":
            case "02":
            case "03":
            case "04":
            case "05":
            case "07":
            case "06":
              this.midi.track[t - 1].event[e - 1].data = this.data.readStr(
                metaEventLength,
              );
              break;
            case "21":
            case "59":
            case "51":
              this.midi.track[t - 1].event[e - 1].data = this.data.readInt(
                metaEventLength,
              );
              break;
            case "54":
              this.midi.track[t - 1].event[e - 1].data = [];
              this.midi.track[t - 1].event[e - 1].data[0] = this.data.readInt(
                1,
              );
              this.midi.track[t - 1].event[e - 1].data[1] = this.data.readInt(
                1,
              );
              this.midi.track[t - 1].event[e - 1].data[2] = this.data.readInt(
                1,
              );
              this.midi.track[t - 1].event[e - 1].data[3] = this.data.readInt(
                1,
              );
              this.midi.track[t - 1].event[e - 1].data[4] = this.data.readInt(
                1,
              );
              break;
            case "58":
              this.midi.track[t - 1].event[e - 1].data = [];
              this.midi.track[t - 1].event[e - 1].data[0] = this.data.readInt(
                1,
              );
              this.midi.track[t - 1].event[e - 1].data[1] = this.data.readInt(
                1,
              );
              this.midi.track[t - 1].event[e - 1].data[2] = this.data.readInt(
                1,
              );
              this.midi.track[t - 1].event[e - 1].data[3] = this.data.readInt(
                1,
              );
              break;
            default:
              if (this.midi.track[t - 1].event[e - 1].data === false) {
                this.data.readInt(metaEventLength);
                this.midi.track[t - 1].event[e - 1].data = this.data.readInt(
                  metaEventLength,
                );
              }
          }
        } else {
          statusByte = statusByte?.toString(16).split("");
          if (!statusByte[1]) statusByte.unshift("0");
          this.midi.track[t - 1].event[e - 1].type = parseInt(
            statusByte[0],
            16,
          );
          this.midi.track[t - 1].event[e - 1].channel = parseInt(
            statusByte[1],
            16,
          );
          switch (this.midi.track[t - 1].event[e - 1].type) {
            case "F": {
              if (this.midi.track[t - 1].event[e - 1].data === false) {
                const event_length = this.data.readIntVLV();
                this.midi.track[t - 1].event[e - 1].data = this.data.readInt(
                  event_length,
                );
              }
              break;
            }
            case "A":
            case "B":
            case "E":
            case "8":
            case "9":
              this.midi.track[t - 1].event[e - 1].data = [];
              this.midi.track[t - 1].event[e - 1].data[0] = this.data.readInt(
                1,
              );
              this.midi.track[t - 1].event[e - 1].data[1] = this.data.readInt(
                1,
              );
              break;
            case "C":
            case "D":
              this.midi.track[t - 1].event[e - 1].data = this.data.readInt(1);
              break;
            case -1:
              endOfTrack = true;
              break;
            default:
              if (this.midi.track[t - 1].event[e - 1].data === false) {
                console.warn("Unknown EVENT detected... reading cancelled!");
                return false;
              }
          }
        }
      }
    }
  }
  print(): void {
    printFile(toHexString(this.file));
  }
}
