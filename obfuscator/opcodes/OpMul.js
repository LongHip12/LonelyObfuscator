const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpMul {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Mul && instruction.B <= 255 && instruction.C <= 255;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]]=Stk[Inst[OP_B]]*Stk[Inst[OP_C]];';
  }
}

class OpMulB {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Mul && instruction.B > 255 && instruction.C <= 255;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]] = Inst[OP_B] * Stk[Inst[OP_C]];';
  }
  mutate(instruction) {
    instruction.B -= 255;
    instruction.constantMask |= InstructionConstantMask.RB;
  }
}

class OpMulC {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Mul && instruction.B <= 255 && instruction.C > 255;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]] = Stk[Inst[OP_B]] * Inst[OP_C];';
  }
  mutate(instruction) {
    instruction.C -= 255;
    instruction.constantMask |= InstructionConstantMask.RC;
  }
}

class OpMulBC {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Mul && instruction.B > 255 && instruction.C > 255;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]] = Inst[OP_B] * Inst[OP_C];';
  }
  mutate(instruction) {
    instruction.B -= 255;
    instruction.C -= 255;
    instruction.constantMask |= InstructionConstantMask.RB | InstructionConstantMask.RC;
  }
}

module.exports = { OpMul, OpMulB, OpMulC, OpMulBC };
