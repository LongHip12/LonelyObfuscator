const { InstructionType, InstructionConstantMask } = require('../ir/Enums');
const Opcode = require('../ir/Opcode');
const ObfuscationContext = require('../obfuscator/ObfuscationContext');

class Serializer {
  constructor(context, settings) {
    this._context = context;
    this._settings = settings;
  }

  serializeLChunk(chunk, factorXor) {
    if (factorXor === undefined) factorXor = true;
    const buffer = [];
    const ctx = this._context;

    const writeByte = (b) => {
      if (factorXor) b ^= ctx.primaryXorKey;
      buffer.push(b & 0xFF);
    };

    const write = (bArr, checkEndian) => {
      if (checkEndian === undefined) checkEndian = true;
      const isLE = this._isLittleEndian();
      if (!isLE && checkEndian) bArr = [...bArr].reverse();
      for (const byte of bArr) {
        let b = byte;
        if (factorXor) b ^= ctx.primaryXorKey;
        buffer.push(b & 0xFF);
      }
    };

    const writeInt32 = (i) => {
      const buf = Buffer.alloc(4);
      buf.writeInt32LE(i, 0);
      write([...buf]);
    };

    const writeInt16 = (i) => {
      const buf = Buffer.alloc(2);
      buf.writeInt16LE(i, 0);
      write([...buf]);
    };

    const writeNumber = (d) => {
      const buf = Buffer.alloc(8);
      buf.writeDoubleLE(d, 0);
      write([...buf]);
    };

    const writeString = (s) => {
      const sBytes = [];
      for (let i = 0; i < s.length; i++)
        sBytes.push(s.charCodeAt(i) & 0xFF);
      writeInt32(sBytes.length);
      write(sBytes, false);
    };

    const writeBool = (b) => {
      const buf = Buffer.alloc(1);
      buf[0] = b ? 1 : 0;
      write([...buf]);
    };

    const serializeInstruction = (inst) => {
      if (inst.instructionType === InstructionType.Data) {
        writeByte(1);
        return;
      }

      inst.updateRegisters();

      const cData = inst.customData;
      let opCode = inst.opCode;

      if (cData) {
        const virtualOpcode = cData.opcode;
        opCode = cData.writtenOpcode ? cData.writtenOpcode.VIndex : virtualOpcode.VIndex;
        if (virtualOpcode && virtualOpcode.mutate) virtualOpcode.mutate(inst);
      }

      const t = inst.instructionType;
      const m = inst.constantMask;
      writeByte((t << 1) | (m << 3));
      writeInt16(opCode);
      writeInt16(inst.A);

      let b = inst.B;
      let c = inst.C;

      switch (inst.instructionType) {
        case InstructionType.AsBx:
          b += 1 << 16;
          writeInt32(b);
          break;
        case InstructionType.AsBxC:
          b += 1 << 16;
          writeInt32(b);
          writeInt16(c);
          break;
        case InstructionType.ABC:
          writeInt16(b);
          writeInt16(c);
          break;
        case InstructionType.ABx:
          writeInt32(b);
          break;
      }
    };

    chunk.updateMappings();

    writeInt32(chunk.constants.length);
    for (const c of chunk.constants) {
      writeByte(ctx.constantMapping[c.type]);
      switch (c.type) {
        case 1: writeBool(c.data); break;
        case 2: writeNumber(c.data); break;
        case 3: writeString(c.data); break;
      }
    }

    const ChunkStep = ObfuscationContext.ChunkStep;
    for (let i = 0; i < ChunkStep.StepCount; i++) {
      switch (ctx.chunkSteps[i]) {
        case ChunkStep.ParameterCount:
          writeByte(chunk.parameterCount);
          break;
        case ChunkStep.Instructions:
          writeInt32(chunk.instructions.length);
          for (const ins of chunk.instructions)
            serializeInstruction(ins);
          break;
        case ChunkStep.Functions:
          writeInt32(chunk.functions.length);
          for (const c of chunk.functions) {
            const subBytes = this.serializeLChunk(c, false);
            for (const b of subBytes) writeByte(b);
          }
          break;
        case ChunkStep.LineInfo:
          if (this._settings.preserveLineInfo) {
            writeInt32(chunk.instructions.length);
            for (const instr of chunk.instructions)
              writeInt32(instr.line);
          }
          break;
      }
    }

    return Buffer.from(buffer);
  }

  _isLittleEndian() {
    const buf = new Uint32Array(1);
    buf[0] = 1;
    return new Uint8Array(buf.buffer)[0] === 1;
  }
}

module.exports = Serializer;
