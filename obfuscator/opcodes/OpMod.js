const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpMod {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Mod && instruction.B <= 255 && instruction.C <= 255;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]]=Stk[Inst[OP_B]]%Stk[Inst[OP_C]];';
  }
}

class OpModB {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Mod && instruction.B > 255 && instruction.C <= 255;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]] = Inst[OP_B] % Stk[Inst[OP_C]];';
  }
  mutate(instruction) {
    instruction.B -= 255;
    instruction.constantMask |= InstructionConstantMask.RB;
  }
}

class OpModC {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Mod && instruction.B <= 255 && instruction.C > 255;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]] = Stk[Inst[OP_B]] % Inst[OP_C];';
  }
  mutate(instruction) {
    instruction.C -= 255;
    instruction.constantMask |= InstructionConstantMask.RC;
  }
}

class OpModBC {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Mod && instruction.B > 255 && instruction.C > 255;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]] = Inst[OP_B] % Inst[OP_C];';
  }
  mutate(instruction) {
    instruction.B -= 255;
    instruction.C -= 255;
    instruction.constantMask |= InstructionConstantMask.RB | InstructionConstantMask.RC;
  }
}

module.exports = { OpMod, OpModB, OpModC, OpModBC };
