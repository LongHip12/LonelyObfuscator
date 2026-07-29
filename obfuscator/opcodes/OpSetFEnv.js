const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpSetFEnv {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.SetFenv;
  }
  getObfuscated(context) {
    return 'Env = Stk[Inst[OP_A]]';
  }
}

module.exports = { OpSetFEnv };
