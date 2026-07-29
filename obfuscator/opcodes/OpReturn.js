const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpReturn {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Return && instruction.B > 3;
  }
  getObfuscated(context) {
    return "local A = Inst[OP_A];\ndo return Unpack(Stk, A, A + Inst[OP_B]) end;\n";
  }
  mutate(instruction) {
    instruction.B -= 2;
  }
}

class OpReturnB2 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Return && instruction.B === 2;
  }
  getObfuscated(context) {
    return "do return Stk[Inst[OP_A]] end\n";
  }
}

class OpReturnB3 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Return && instruction.B === 3;
  }
  getObfuscated(context) {
    return "local A = Inst[OP_A]; \ndo return Stk[A], Stk[A + 1] end\n";
  }
}

class OpReturnB0 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Return && instruction.B === 0;
  }
  getObfuscated(context) {
    return "local A = Inst[OP_A]; \ndo return Unpack(Stk, A, Top) end;";
  }
}

class OpReturnB1 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Return && instruction.B === 1;
  }
  getObfuscated(context) {
    return "do return end;";
  }
}

module.exports = { OpReturn, OpReturnB2, OpReturnB3, OpReturnB0, OpReturnB1 };
