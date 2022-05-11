// deno-lint-ignore-file no-explicit-any
const FRAME_RATES: any = {
  24: 0x00,
  25: 0x20,
  29: 0x40,
  30: 0x60,
};
export class Writer {
  #buffer: number[] = [];
  writeUint8(value: number): void {
    this.#buffer.push(value & 0xff);
  }
  writeUint16(value: number): void {
    this.writeUint8((value >> 8) & 0xff);
    this.writeUint8(value & 0xff);
  }
  writeUint24(value: number): void {
    this.writeUint8((value >> 16) & 0xff);
    this.writeUint8((value >> 8) & 0xff);
    this.writeUint8(value & 0xff);
  }
  writeUint32(value: number): void {
    this.writeUint8((value >> 24) & 0xff);
    this.writeUint8((value >> 16) & 0xff);
    this.writeUint8((value >> 8) & 0xff);
    this.writeUint8(value & 0xff);
  }
  writeBytes(value: number[]): void {
    this.#buffer.push(...value);
  }
  writeString(value: string): void {
    this.#buffer.push(...value.split("").map((char) => char.charCodeAt(0)));
  }
  writeInt(value: number): void {
    if (value < 0) throw new Error("value must be positive");
    if (value < 0x7f) { // 0x7f = 0b01111111
      this.writeUint8(value);
    } else {
      let i = value;
      const bytes = [];
      bytes.push(i & 0x7f);
      i >>= 7;
      while (i) {
        bytes.push(i & 0x7f | 0x80);
        i >>= 7;
      }
      this.writeBytes(bytes.reverse());
    }
  }
  writeChunk(id: string, data: number[]): void {
    this.writeString(id);
    this.writeUint32(data.length);
    this.writeBytes(data);
  }
  get buffer(): number[] {
    return this.#buffer;
  }
}

export class Generator {
  #data: any;
  #opts: any;
  #writer = new Writer();
  constructor(data: any, opts: any = {}) {
    this.#data = data;
    this.#opts = opts;
    if (typeof data !== "object") throw new Error("data must be an object");
  }
  write(): number[] {
    const header = this.#data.header || {};
    const tracks = this.#data.tracks || [];
    const len = tracks.length;
    this.writeHeader(header, len);
    for (let i = 0; i < len; i++) {
      this.writeTrack(tracks[i]);
    }
    return this.#writer.buffer;
  }
  writeHeader(header: any, trackCount: number) {
    const format = header.format === null ? 1 : header.format;
    const timeDivision = header.timeDivision
      ? header.timeDivision
      : header.ticksPerFrame && header.framesPerSecond
      ? (-(header.framesPerSecond & 0xff) << 8) | (header.ticksPerFrame & 0xff)
      : header.ticksPerBeat
      ? header.ticksPerBeat & 0x7fff
      : 128;
    const h = new Writer();
    h.writeUint16(format);
    h.writeUint16(trackCount);
    h.writeUint16(timeDivision);
    this.#writer.writeChunk("MThd", h.buffer);
  }
  writeTrack(track: any) {
    const t = new Writer();
    const len = track.length;
    let eventType = null;
    for (let i = 0; i < len; i++) {
      eventType =
        (!this.#opts.running || !this.#opts.running && !track[i].running)
          ? null
          : this.writeEvent(
            t,
            track[i],
            eventType,
            this.#opts.useByte9ForNoteOff,
          );
    }
    this.#writer.writeChunk("MTrk", t.buffer);
  }
  writeEvent(
    trackWriter: Writer,
    event: any,
    lastEventTypeByte: any,
    useByte9ForNoteOff: boolean,
  ) {
    const type = event.type;
    const deltaTime = event.deltaTime;
    const text = event.text || "";
    const data = event.data || [];
    let eventTypeByte = null;
    trackWriter.writeInt(deltaTime);
    switch (type) {
      // meta
      case "sequenceNumber":
        trackWriter.writeUint8(0xff);
        trackWriter.writeUint8(0x00);
        trackWriter.writeInt(2);
        trackWriter.writeUint16(event.number);
        break;
      case "text":
        trackWriter.writeUint8(0xff);
        trackWriter.writeUint8(0x01);
        trackWriter.writeInt(text.length);
        trackWriter.writeString(text);
        break;
      case "copyrightNotice":
        trackWriter.writeUint8(0xff);
        trackWriter.writeUint8(0x02);
        trackWriter.writeInt(text.length);
        trackWriter.writeString(text);
        break;
      case "trackName":
        trackWriter.writeUint8(0xff);
        trackWriter.writeUint8(0x03);
        trackWriter.writeInt(text.length);
        trackWriter.writeString(text);
        break;
      case "instrumentName":
        trackWriter.writeUint8(0xff);
        trackWriter.writeUint8(0x04);
        trackWriter.writeInt(text.length);
        trackWriter.writeString(text);
        break;
      case "lyric":
        trackWriter.writeUint8(0xff);
        trackWriter.writeUint8(0x05);
        trackWriter.writeInt(text.length);
        trackWriter.writeString(text);
        break;
      case "marker":
        trackWriter.writeUint8(0xff);
        trackWriter.writeUint8(0x06);
        trackWriter.writeInt(text.length);
        trackWriter.writeString(text);
        break;
      case "cuePoint":
        trackWriter.writeUint8(0xff);
        trackWriter.writeUint8(0x07);
        trackWriter.writeInt(text.length);
        trackWriter.writeString(text);
        break;
      case "channelPrefix":
        trackWriter.writeUint8(0xff);
        trackWriter.writeUint8(0x20);
        trackWriter.writeInt(1);
        trackWriter.writeUint8(event.channel);
        break;
      case "portPrefix":
        trackWriter.writeUint8(0xff);
        trackWriter.writeUint8(0x21);
        trackWriter.writeInt(1);
        trackWriter.writeUint8(event.port);
        break;
      case "endOfTrack":
        trackWriter.writeUint8(0xff);
        trackWriter.writeUint8(0x2f);
        trackWriter.writeInt(0);
        break;
      case "setTempo":
        trackWriter.writeUint8(0xff);
        trackWriter.writeUint8(0x51);
        trackWriter.writeInt(3);
        trackWriter.writeUint24(event.microsecondsPerBeat);
        break;
      case "smpteOffset": {
        trackWriter.writeUint8(0xff);
        trackWriter.writeUint8(0x54);
        trackWriter.writeInt(5);
        const hourByte = (event.hour & 0x1f) | FRAME_RATES[event.frameRate];
        trackWriter.writeUint8(hourByte);
        trackWriter.writeUint8(event.min);
        trackWriter.writeUint8(event.sec);
        trackWriter.writeUint8(event.frame);
        trackWriter.writeUint8(event.subFrame);
        break;
      }
      case "timeSignature":
        trackWriter.writeUint8(0xff);
        trackWriter.writeUint8(0x58);
        trackWriter.writeInt(4);
        trackWriter.writeUint8(event.numerator);
        trackWriter.writeUint8(
          Math.floor(Math.log(event.denominator) / Math.LN2) & 0xFF,
        );
        trackWriter.writeUint8(event.metronome);
        trackWriter.writeUint8(event.thirtyseconds || 8);
        break;
      case "keySignature":
        trackWriter.writeUint8(0xff);
        trackWriter.writeUint8(0x59);
        trackWriter.writeInt(2);
        trackWriter.writeUint8(event.key);
        trackWriter.writeUint8(event.scale);
        break;
      case "sequencerSpecific":
        trackWriter.writeUint8(0xff);
        trackWriter.writeUint8(0x7f);
        trackWriter.writeInt(data.length);
        trackWriter.writeBytes(data);
        break;
      case "unknownMeta":
        if (event.metaTypeByte) {
          trackWriter.writeUint8(0xff);
          trackWriter.writeUint8(event.metaTypeByte);
          trackWriter.writeInt(data.length);
          trackWriter.writeBytes(data);
        }
        break;
        // system exclusive
      case "sysEx":
        trackWriter.writeUint8(0xf0);
        trackWriter.writeInt(data.length);
        trackWriter.writeBytes(data);
        break;
      case "endOfSysEx":
        trackWriter.writeUint8(0xf7);
        trackWriter.writeInt(data.length);
        trackWriter.writeBytes(data);
        break;
      // channel
      case "noteOff": {
        const noteByte = ((useByte9ForNoteOff !== false && event.byte9) ||
            (useByte9ForNoteOff && event.velocity == 0))
          ? 0x90
          : 0x80;
        eventTypeByte = noteByte | event.channel;
        if (eventTypeByte !== lastEventTypeByte) {
          trackWriter.writeUint8(eventTypeByte);
        }
        trackWriter.writeUint8(event.noteNumber);
        trackWriter.writeUint8(event.velocity);
        break;
      }
      case "noteOn":
        eventTypeByte = 0x90 | event.channel;
        if (eventTypeByte !== lastEventTypeByte) {
          trackWriter.writeUint8(eventTypeByte);
        }
        trackWriter.writeUint8(event.noteNumber);
        trackWriter.writeUint8(event.velocity);
        break;
      case "noteAftertouch":
        eventTypeByte = 0xa0 | event.channel;
        if (eventTypeByte !== lastEventTypeByte) {
          trackWriter.writeUint8(eventTypeByte);
        }
        trackWriter.writeUint8(event.noteNumber);
        trackWriter.writeUint8(event.velocity);
        break;
      case "controller":
        eventTypeByte = 0xb0 | event.channel;
        if (eventTypeByte !== lastEventTypeByte) {
          trackWriter.writeUint8(eventTypeByte);
        }
        trackWriter.writeUint8(event.controllerType);
        trackWriter.writeUint8(event.value);
        break;
      case "programChange":
        eventTypeByte = 0xc0 | event.channel;
        if (eventTypeByte !== lastEventTypeByte) {
          trackWriter.writeUint8(eventTypeByte);
        }
        trackWriter.writeUint8(event.programNumber);
        break;
      case "channelAftertouch":
        eventTypeByte = 0xd0 | event.channel;
        if (eventTypeByte !== lastEventTypeByte) {
          trackWriter.writeUint8(eventTypeByte);
        }
        trackWriter.writeUint8(event.amount);
        break;
      case "pitchBend": {
        eventTypeByte = 0xe0 | event.channel;
        if (eventTypeByte !== lastEventTypeByte) {
          trackWriter.writeUint8(eventTypeByte);
        }
        const value = event.value + 0x2000;
        trackWriter.writeUint8(value & 0x7f);
        trackWriter.writeUint8((value >> 7) & 0x7f);
        break;
      }
      default:
        throw new Error(`Unknown event type: ${type}`);
    }
    return eventTypeByte;
  }
}
