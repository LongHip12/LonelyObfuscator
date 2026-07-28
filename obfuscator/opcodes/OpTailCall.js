const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpTailCall {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.TailCall && instruction.B > 2 && instruction.C === 0;
  }
  getObfuscated(context) {
    return "local A=Inst[OP_A];return {Stk[A](Unpack(Stk,A+1,Inst[OP_B]))};";
  }
  mutate(instruction) {
    instruction.B += instruction.A - 1;
  }
}

class OpTailCallC {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.TailCall && instruction.B > 2 && instruction.C === 1;
  }
  getObfuscated(context) {
    return "local A=Inst[OP_A];return Stk[A](Unpack(Stk,A+1,Inst[OP_B]));";
  }
  mutate(instruction) {
    instruction.B += instruction.A - 1;
  }
}

class OpTailCallB2 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.TailCall && instruction.B === 2 && instruction.C === 0;
  }
  getObfuscated(context) {
    return "local A=Inst[OP_A];return {Stk[A](Stk[A+1])};";
  }
}

class OpTailCallB0C0 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.TailCall && instruction.B === 0 && instruction.C === 0;
  }
  getObfuscated(context) {
    return "local A=Inst[OP_A];return {Stk[A](Unpack(Stk,A+1,Top))};";
  }
}

class OpTailCallB0C2 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.TailCall && instruction.B === 0 && instruction.C === 2;
  }
  getObfuscated(context) {
    return "local A=Inst[OP_A];return Stk[A](Unpack(Stk,A+1,Top));";
  }
}

module.exports = { OpTailCall, OpTailCallC, OpTailCallB2, OpTailCallB0C0, OpTailCallB0C2 };
