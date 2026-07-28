const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpNot {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Not;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]]=(not Stk[Inst[OP_B]]);';
  }
}

module.exports = { OpNot };
