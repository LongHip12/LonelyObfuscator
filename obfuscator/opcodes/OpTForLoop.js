const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpTForLoop {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.TForLoop;
  }
  getObfuscated(context) {
    return "local A=Inst[OP_A];local C=Inst[OP_C];local D=Stk[A+1];local E=Stk[A];Stk[C]=D;Stk[C+1]=E;Stk[C+2]=Stk[A+2];local R={D(E,unpack(Stk,C+2,C+Inst[OP_B]))};for Idx=1,C-Inst[OP_B]+2 do Stk[A+Idx+2]=R[Idx];end;if Stk[A+3]~=nil then Stk[C]=Stk[A+3] else InstrPoint=InstrPoint+1 end;";
  }
  mutate(instruction) {
    instruction.B += instruction.pc + 1;
  }
}

module.exports = { OpTForLoop };
