const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpClose {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Close;
  }
  getObfuscated(context) {
    return 'local A=Inst[OP_A];local Cls={};for Idx=1,#Lupvals do local List=Lupvals[Idx];for Idz=0,#List do local Upv=List[Idz];local NStk=Upv[1];local Pos=Upv[2]; if NStk==Stk and Pos>=A then Cls[Pos]=NStk[Pos];Upv[1]=Cls;end;end;end;';
  }
}

module.exports = { OpClose };
