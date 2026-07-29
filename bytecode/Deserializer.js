const { ConstantType, InstructionType } = require('../ir/Enums');
const Constant = require('../ir/Constant');
const Instruction = require('../ir/Instruction');
const Chunk = require('../ir/Chunk');
const Opcode = require('../ir/Opcode');

const InstructionMappings = {};
InstructionMappings[Opcode.Move] = InstructionType.ABC;
InstructionMappings[Opcode.LoadConst] = InstructionType.ABx;
InstructionMappings[Opcode.LoadBool] = InstructionType.ABC;
InstructionMappings[Opcode.LoadNil] = InstructionType.ABC;
InstructionMappings[Opcode.GetUpval] = InstructionType.ABC;
InstructionMappings[Opcode.GetGlobal] = InstructionType.ABx;
InstructionMappings[Opcode.GetTable] = InstructionType.ABC;
InstructionMappings[Opcode.SetGlobal] = InstructionType.ABx;
InstructionMappings[Opcode.SetUpval] = InstructionType.ABC;
InstructionMappings[Opcode.SetTable] = InstructionType.ABC;
InstructionMappings[Opcode.NewTable] = InstructionType.ABC;
InstructionMappings[Opcode.Self] = InstructionType.ABC;
InstructionMappings[Opcode.Add] = InstructionType.ABC;
InstructionMappings[Opcode.Sub] = InstructionType.ABC;
InstructionMappings[Opcode.Mul] = InstructionType.ABC;
InstructionMappings[Opcode.Div] = InstructionType.ABC;
InstructionMappings[Opcode.Mod] = InstructionType.ABC;
InstructionMappings[Opcode.Pow] = InstructionType.ABC;
InstructionMappings[Opcode.Unm] = InstructionType.ABC;
InstructionMappings[Opcode.Not] = InstructionType.ABC;
InstructionMappings[Opcode.Len] = InstructionType.ABC;
InstructionMappings[Opcode.Concat] = InstructionType.ABC;
InstructionMappings[Opcode.Jmp] = InstructionType.AsBx;
InstructionMappings[Opcode.Eq] = InstructionType.ABC;
InstructionMappings[Opcode.Lt] = InstructionType.ABC;
InstructionMappings[Opcode.Le] = InstructionType.ABC;
InstructionMappings[Opcode.Test] = InstructionType.ABC;
InstructionMappings[Opcode.TestSet] = InstructionType.ABC;
InstructionMappings[Opcode.Call] = InstructionType.ABC;
InstructionMappings[Opcode.TailCall] = InstructionType.ABC;
InstructionMappings[Opcode.Return] = InstructionType.ABC;
InstructionMappings[Opcode.ForLoop] = InstructionType.AsBx;
InstructionMappings[Opcode.ForPrep] = InstructionType.AsBx;
InstructionMappings[Opcode.TForLoop] = InstructionType.ABC;
InstructionMappings[Opcode.SetList] = InstructionType.ABC;
InstructionMappings[Opcode.Close] = InstructionType.ABC;
InstructionMappings[Opcode.Closure] = InstructionType.ABx;
InstructionMappings[Opcode.VarArg] = InstructionType.ABC;

class Deserializer {
  constructor(input) {
    this._buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
    this._pos = 0;
    this._bigEndian = false;
    this._sizeNumber = 8;
    this._sizeSizeT = 4;
    this._expectingSetlistData = false;
  }

  _read(size, factorEndianness) {
    if (factorEndianness === undefined) factorEndianness = true;
    const bytes = this._buffer.slice(this._pos, this._pos + size);
    this._pos += size;
    if (factorEndianness && (this._bigEndian === this._isLittleEndian())) {
      return Buffer.from([...bytes].reverse());
    }
    return bytes;
  }

  _isLittleEndian() {
    const buf = new Uint32Array(1);
    buf[0] = 1;
    return new Uint8Array(buf.buffer)[0] === 1;
  }

  _readSizeT() {
    return this._sizeSizeT === 4 ? this._readInt32() : this._readInt64();
  }

  _readInt64() {
    const bytes = this._read(8);
    const lo = bytes.readUInt32LE(0);
    const hi = bytes.readUInt32LE(4);
    return hi * 0x100000000 + lo;
  }

  _readInt32(factorEndianness) {
    if (factorEndianness === undefined) factorEndianness = true;
    const bytes = this._read(4, factorEndianness);
    return bytes.readInt32LE(0);
  }

  _readByte() {
    return this._read(1)[0];
  }

  _readString() {
    const c = this._readSizeT();
    const count = c;
    if (count === 0) return '';
    const val = this._read(count, false);
    const str = val.toString('latin1');
    if (str.charCodeAt(str.length - 1) === 0) return str.slice(0, -1);
    return str;
  }

  _readDouble() {
    const bytes = this._read(this._sizeNumber);
    return bytes.readDoubleLE(0);
  }

  _readUInt32() {
    const bytes = this._read(4, true);
    return bytes.readUInt32LE(0);
  }

  decodeInstruction(chunk, index) {
    const code = this._readInt32();
    const i = new Instruction(chunk, code & 0x3F);
    i.data = code;

    if (this._expectingSetlistData) {
      this._expectingSetlistData = false;
      i.instructionType = InstructionType.Data;
      return i;
    }

    i.A = (code >> 6) & 0xFF;

    switch (i.instructionType) {
      case InstructionType.ABC:
        i.B = (code >> (6 + 8 + 9)) & 0x1FF;
        i.C = (code >> (6 + 8)) & 0x1FF;
        break;
      case InstructionType.ABx:
        i.B = (code >> (6 + 8)) & 0x3FFFF;
        i.C = -1;
        break;
      case InstructionType.AsBx:
        i.B = ((code >> (6 + 8)) & 0x3FFFF) - 131071;
        i.C = -1;
        break;
    }

    if (i.opCode === Opcode.SetList && i.C === 0)
      this._expectingSetlistData = true;

    return i;
  }

  decodeInstructions(chunk) {
    const instructions = [];
    const count = this._readInt32();
    for (let i = 0; i < count; i++)
      instructions.push(this.decodeInstruction(chunk, i));
    return instructions;
  }

  decodeConstant() {
    const c = new Constant();
    const type = this._readByte();
    switch (type) {
      case 0: c.type = ConstantType.Nil; c.data = null; break;
      case 1: c.type = ConstantType.Boolean; c.data = this._readByte() !== 0; break;
      case 3: c.type = ConstantType.Number; c.data = this._readDouble(); break;
      case 4: c.type = ConstantType.String; c.data = this._readString(); break;
    }
    return c;
  }

  decodeConstants() {
    const constants = [];
    const count = this._readInt32();
    for (let i = 0; i < count; i++)
      constants.push(this.decodeConstant());
    return constants;
  }

  decodeChunk() {
    const c = new Chunk();
    c.name = this._readString();
    c.line = this._readInt32();
    c.lastLine = this._readInt32();
    c.upvalueCount = this._readByte();
    c.parameterCount = this._readByte();
    c.varargFlag = this._readByte();
    c.stackSize = this._readByte();
    c.upvalues = [];

    c.instructions = this.decodeInstructions(c);
    c.constants = this.decodeConstants();
    c.functions = this.decodeChunks();

    c.updateMappings();

    for (const inst of c.instructions)
      inst.setupRefs();

    let count = this._readInt32();
    for (let i = 0; i < count; i++) {
      const lineNo = this._readInt32();
      if (i < c.instructions.length)
        c.instructions[i].line = lineNo;
    }

    count = this._readInt32();
    for (let i = 0; i < count; i++) {
      this._readString();
      this._readInt32();
      this._readInt32();
    }

    count = this._readInt32();
    for (let i = 0; i < count; i++)
      c.upvalues.push(this._readString());

    return c;
  }

  decodeChunks() {
    const chunks = [];
    const count = this._readInt32();
    for (let i = 0; i < count; i++)
      chunks.push(this.decodeChunk());
    return chunks;
  }

  decodeFile() {
    const header = this._readInt32();
    if (header !== 0x1B4C7561 && header !== 0x61754C1B)
      throw new Error('Invalid luac file.');

    if (this._readByte() !== 0x51)
      throw new Error('Only Lua 5.1 is supported.');

    this._readByte();
    this._bigEndian = this._readByte() === 0;
    this._readByte();
    this._sizeSizeT = this._readByte();
    this._readByte();
    this._sizeNumber = this._readByte();
    this._readByte();

    return this.decodeChunk();
  }
}

Deserializer.InstructionMappings = InstructionMappings;
module.exports = Deserializer;
