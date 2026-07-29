const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpGetUpval {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.GetUpval;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]]=Upvalues[Inst[OP_B]];';
  }
}

module.exports = { OpGetUpval };
