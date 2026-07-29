const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpSetUpval {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.SetUpval;
  }
  getObfuscated(context) {
    return 'Upvalues[Inst[OP_B]]=Stk[Inst[OP_A]];';
  }
}

module.exports = { OpSetUpval };
