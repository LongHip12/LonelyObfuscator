const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpSetGlobal {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.SetGlobal;
  }
  getObfuscated(context) {
    return 'Env[Inst[OP_B]] = Stk[Inst[OP_A]];';
  }
  mutate(instruction) {
    instruction.B++;
    instruction.constantMask |= InstructionConstantMask.RB;
  }
}

module.exports = { OpSetGlobal };
