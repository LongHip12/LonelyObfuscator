const { ConstantType } = require('../ir/Enums');
const Constant = require('../ir/Constant');
const Instruction = require('../ir/Instruction');
const Chunk = require('../ir/Chunk');
const Opcode = require('../ir/Opcode');

class VanillaSerializer {
  constructor(chunk) {
    this._chunk = chunk;
  }

  serialize() {
    const res = [];
    const writeByte = (b) => res.push(b & 0xFF);
    const writeInt = (i) => {
      const buf = Buffer.alloc(4);
      buf.writeInt32LE(i, 0);
      for (let j = 0; j < 4; j++) res.push(buf[j]);
    };
    const writeUInt = (i) => {
      const buf = Buffer.alloc(4);
      buf.writeUInt32LE(i, 0);
      for (let j = 0; j < 4; j++) res.push(buf[j]);
    };
    const writeNum = (d) => {
      const buf = Buffer.alloc(8);
      buf.writeDoubleLE(d, 0);
      for (let j = 0; j < 8; j++) res.push(buf[j]);
    };
    const writeString = (str) => {
      const bytes = [];
      for (let i = 0; i < str.length; i++)
        bytes.push(str.charCodeAt(i) & 0xFF);
      writeInt(bytes.length + 1);
      for (const b of bytes) res.push(b);
      writeByte(0);
    };

    const writeChunk = (chunk) => {
      if (chunk.name !== '') writeString(chunk.name);
      else writeInt(0);

      writeInt(chunk.line);
      writeInt(chunk.lastLine);
      writeByte(chunk.upvalueCount);
      writeByte(chunk.parameterCount);
      writeByte(chunk.varargFlag);
      writeByte(chunk.stackSize);

      chunk.updateMappings();

      writeInt(chunk.instructions.length);
      for (const i of chunk.instructions) {
        i.updateRegisters();

        let a = i.A, b = i.B, c = i.C;
        let result = 0;
        result |= i.opCode;
        result |= (a << 6);

        switch (i.instructionType) {
          case 1:
            result |= (b << (6 + 8));
            break;
          case 2:
            b += 131071;
            result |= (b << (6 + 8));
            break;
          case 0:
            result |= (c << (6 + 8));
            result |= (b << (6 + 8 + 9));
            break;
        }
        writeUInt(result >>> 0);
      }

      writeInt(chunk.constants.length);
      for (const constant of chunk.constants) {
        switch (constant.type) {
          case ConstantType.Nil: writeByte(0); break;
          case ConstantType.Boolean: writeByte(1); writeByte(constant.data ? 1 : 0); break;
          case ConstantType.Number: writeByte(3); writeNum(constant.data); break;
          case ConstantType.String: writeByte(4); writeString(constant.data); break;
        }
      }

      writeInt(chunk.functions.length);
      for (const sChunk of chunk.functions)
        writeChunk(sChunk);

      writeInt(0);
      writeInt(0);
      writeInt(0);
    };

    writeByte(27);
    const luaStr = 'Lua';
    for (let i = 0; i < luaStr.length; i++) res.push(luaStr.charCodeAt(i));
    writeByte(0x51);
    writeByte(0);
    writeByte(1);
    writeByte(4);
    writeByte(4);
    writeByte(4);
    writeByte(8);
    writeByte(0);

    writeChunk(this._chunk);

    return Buffer.from(res);
  }
}

module.exports = VanillaSerializer;
