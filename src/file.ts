export class FileThing {
  public pointer = 0;

  constructor(
    public data: DataView | any,
  ) {}
  public movePointer(_bytes: number) {
    this.pointer += _bytes;
    return this.pointer;
  }
  public readInt(_bytes: number) {
    _bytes = Math.min(_bytes, this.data.byteLength - this.pointer);
    if (_bytes < 1) return -1;
    let value = 0;
    if (_bytes > 1) {
      for (let i = 1; i <= (_bytes - 1); i++) {
        value += this.data.getUint8(this.pointer) * Math.pow(256, _bytes - i);
        this.pointer++;
      }
    }
    value += this.data.getUint8(this.pointer);
    this.pointer++;
    return value;
  }
  public readStr(_bytes: number) {
    let text = "";
    for (let char = 1; char <= _bytes; char++) {
      text += String.fromCharCode(this.data.readInt(1));
    }
    return text;
  }
  public readIntVLV() {
    let value = 0;
    if (this.pointer >= this.data.byteLength) {
      return -1;
    } else if (this.data.getUint8(this.pointer) < 128) {
      value = this.readInt(1);
    } else {
      let FirstBytes = [];
      while (this.data.getUint8(this.pointer) >= 128) {
        FirstBytes.push(this.readInt(1) - 128);
      }
      let lastByte = this.readInt(1);
      for (let dt = 1; dt <= FirstBytes.length; dt++) {
        value += FirstBytes[FirstBytes.length - dt] * Math.pow(128, dt);
      }
      value += lastByte;
    }
    return value;
  }
}
