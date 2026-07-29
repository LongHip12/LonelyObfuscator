const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpSelf {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Self && instruction.C <= 255;
  }
  getObfuscated(context) {
    return 'local A=Inst[OP_A];local B=Stk[Inst[OP_B]];Stk[A+1]=B;Stk[A]=B[Stk[Inst[OP_C]]];';
  }
}

class OpSelfC {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Self && instruction.C > 255;
  }
  getObfuscated(context) {
    return 'local A=Inst[OP_A];local B=Stk[Inst[OP_B]];Stk[A+1]=B;Stk[A]=B[Inst[OP_C]];';
  }
  mutate(instruction) {
    instruction.C -= 255;
    instruction.constantMask |= InstructionConstantMask.RC;
  }
}

module.exports = { OpSelf, OpSelfC };
