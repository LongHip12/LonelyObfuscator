const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpLoadK {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.LoadConst;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]] = Inst[OP_B];';
  }
  mutate(instruction) {
    instruction.B++;
    instruction.constantMask |= InstructionConstantMask.RB;
  }
}

module.exports = { OpLoadK };
