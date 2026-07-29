const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpLen {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Len;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]]=#Stk[Inst[OP_B]];';
  }
}

module.exports = { OpLen };
