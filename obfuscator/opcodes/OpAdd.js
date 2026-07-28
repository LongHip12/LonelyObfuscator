const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpAdd {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Add && instruction.B <= 255 && instruction.C <= 255;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]]=Stk[Inst[OP_B]]+Stk[Inst[OP_C]];';
  }
}

class OpAddB {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Add && instruction.B > 255 && instruction.C <= 255;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]] = Inst[OP_B] + Stk[Inst[OP_C]];';
  }
  mutate(instruction) {
    instruction.B -= 255;
    instruction.constantMask |= InstructionConstantMask.RB;
  }
}

class OpAddC {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Add && instruction.B <= 255 && instruction.C > 255;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]] = Stk[Inst[OP_B]] + Inst[OP_C];';
  }
  mutate(instruction) {
    instruction.C -= 255;
    instruction.constantMask |= InstructionConstantMask.RC;
  }
}

class OpAddBC {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Add && instruction.B > 255 && instruction.C > 255;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]] = Inst[OP_B] + Inst[OP_C];';
  }
  mutate(instruction) {
    instruction.B -= 255;
    instruction.C -= 255;
    instruction.constantMask |= InstructionConstantMask.RB | InstructionConstantMask.RC;
  }
}

module.exports = { OpAdd, OpAddB, OpAddC, OpAddBC };
