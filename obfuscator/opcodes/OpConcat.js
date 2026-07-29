const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpConcat {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Concat;
  }
  getObfuscated(context) {
    return 'local B=Inst[OP_B];local K=Stk[B] for Idx=B+1,Inst[OP_C] do K=K..Stk[Idx];end;Stk[Inst[OP_A]]=K;';
  }
}

module.exports = { OpConcat };
