const Opcode = require('./Opcode');

class Chunk {
  constructor() {
    this.name = '';
    this.line = 0;
    this.lastLine = 0;
    this.upvalueCount = 0;
    this.parameterCount = 0;
    this.varargFlag = 0;
    this.stackSize = 0;
    this.currentOffset = 0;
    this.currentParamOffset = 0;
    this.instructions = [];
    this.instructionMap = new Map();
    this.constants = [];
    this.constantMap = new Map();
    this.functions = [];
    this.functionMap = new Map();
    this.upvalues = [];
  }

  updateMappings() {
    this.instructionMap.clear();
    this.constantMap.clear();
    this.functionMap.clear();
    for (let i = 0; i < this.instructions.length; i++)
      this.instructionMap.set(this.instructions[i], i);
    for (let i = 0; i < this.constants.length; i++)
      this.constantMap.set(this.constants[i], i);
    for (let i = 0; i < this.functions.length; i++)
      this.functionMap.set(this.functions[i], i);
  }

  rebase(offset, paramOffset) {
    offset = offset || 0;
    paramOffset = paramOffset || 0;
    offset -= this.currentOffset;
    paramOffset -= this.currentParamOffset;
    this.currentOffset += offset;
    this.currentParamOffset += paramOffset;
    this.stackSize += offset;
    const Params = this.parameterCount - 1;
    for (let i = 0; i < this.instructions.length; i++) {
      const instr = this.instructions[i];
      switch (instr.opCode) {
        case Opcode.Move:
        case Opcode.LoadNil:
        case Opcode.Unm:
        case Opcode.Not:
        case Opcode.Len:
        case Opcode.TestSet:
          if (instr.A > Params) instr.A += offset; else instr.A += paramOffset;
          if (instr.B > Params) instr.B += offset; else instr.B += paramOffset;
          break;
        case Opcode.LoadConst:
        case Opcode.LoadBool:
        case Opcode.GetGlobal:
        case Opcode.SetGlobal:
        case Opcode.GetUpval:
        case Opcode.SetUpval:
        case Opcode.Call:
        case Opcode.TailCall:
        case Opcode.Return:
        case Opcode.VarArg:
        case Opcode.Test:
        case Opcode.ForPrep:
        case Opcode.ForLoop:
        case Opcode.TForLoop:
        case Opcode.NewTable:
        case Opcode.SetList:
        case Opcode.Close:
          if (instr.A > Params) instr.A += offset; else instr.A += paramOffset;
          break;
        case Opcode.GetTable:
        case Opcode.SetTable:
          if (instr.A > Params) instr.A += offset; else instr.A += paramOffset;
          if (instr.B < 255) { if (instr.B > Params) instr.B += offset; else instr.B += paramOffset; }
          if (instr.C > Params) instr.C += offset; else instr.C += paramOffset;
          break;
        case Opcode.Add:
        case Opcode.Sub:
        case Opcode.Mul:
        case Opcode.Div:
        case Opcode.Mod:
        case Opcode.Pow:
          if (instr.A > Params) instr.A += offset; else instr.A += paramOffset;
          if (instr.B < 255) { if (instr.B > Params) instr.B += offset; else instr.B += paramOffset; }
          if (instr.C < 255) { if (instr.C > Params) instr.C += offset; else instr.C += paramOffset; }
          break;
        case Opcode.Concat:
          if (instr.A > Params) instr.A += offset; else instr.A += paramOffset;
          if (instr.B > Params) instr.B += offset; else instr.B += paramOffset;
          if (instr.C > Params) instr.C += offset; else instr.C += paramOffset;
          break;
        case Opcode.Self:
          if (instr.A > Params) instr.A += offset; else instr.A += paramOffset;
          if (instr.B > Params) instr.B += offset; else instr.B += paramOffset;
          if (instr.C < 255) { if (instr.C > Params) instr.C += offset; else instr.C += paramOffset; }
          break;
        case Opcode.Eq:
        case Opcode.Lt:
        case Opcode.Le:
          if (instr.B < 255) { if (instr.B > Params) instr.B += offset; else instr.B += paramOffset; }
          if (instr.C < 255) { if (instr.C > Params) instr.C += offset; else instr.C += paramOffset; }
          break;
        case Opcode.Closure:
          if (instr.A > Params) instr.A += offset; else instr.A += paramOffset;
          const nProto = this.functions[instr.B];
          for (let i2 = 0; i2 < nProto.upvalueCount; i2++) {
            const cInst = this.instructions[i + i2 + 1];
            if (cInst.opCode !== Opcode.Move) continue;
            if (cInst.B > Params) cInst.B += offset; else cInst.B += paramOffset;
          }
          i += nProto.upvalueCount;
          break;
      }
    }
    return this.parameterCount;
  }
}

module.exports = Chunk;
