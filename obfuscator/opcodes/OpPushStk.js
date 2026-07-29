const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpPushStk {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.PushStack;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]] = Stk';
  }
}

module.exports = { OpPushStk };
