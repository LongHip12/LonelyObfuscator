const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpNewTable {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.NewTable;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]]={};';
  }
}

module.exports = { OpNewTable };
