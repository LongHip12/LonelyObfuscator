const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpLoadNil {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.LoadNil;
  }
  getObfuscated(context) {
    return 'for Idx=Inst[OP_A],Inst[OP_B] do Stk[Idx]=nil;end;';
  }
}

module.exports = { OpLoadNil };
