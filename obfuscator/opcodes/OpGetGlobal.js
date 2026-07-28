const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpGetGlobal {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.GetGlobal;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]]=Env[Inst[OP_B]];';
  }
  mutate(instruction) {
    instruction.B++;
    instruction.constantMask |= InstructionConstantMask.RB;
  }
}

module.exports = { OpGetGlobal };
