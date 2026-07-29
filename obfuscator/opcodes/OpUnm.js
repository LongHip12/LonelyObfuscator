const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpUnm {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Unm;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]]=-Stk[Inst[OP_B]];';
  }
}

module.exports = { OpUnm };
