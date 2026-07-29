const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpSetTable {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.SetTable && instruction.C <= 255;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_B]][Stk[Inst[OP_C]]]=Stk[Inst[OP_A]];';
  }
}

class OpSetTableConst {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.SetTable && instruction.C > 255;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_B]][Inst[OP_C]]=Stk[Inst[OP_A]];';
  }
  mutate(instruction) {
    instruction.C -= 255;
    instruction.constantMask |= InstructionConstantMask.RC;
  }
}

module.exports = { OpSetTable, OpSetTableConst };
