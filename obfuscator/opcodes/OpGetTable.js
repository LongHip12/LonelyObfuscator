const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpGetTable {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.GetTable && instruction.C <= 255;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]]=Stk[Inst[OP_B]][Stk[Inst[OP_C]]];';
  }
}

class OpGetTableConst {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.GetTable && instruction.C > 255;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]]=Stk[Inst[OP_B]][Inst[OP_C]];';
  }
  mutate(instruction) {
    instruction.C -= 255;
    instruction.constantMask |= InstructionConstantMask.RC;
  }
}

module.exports = { OpGetTable, OpGetTableConst };
