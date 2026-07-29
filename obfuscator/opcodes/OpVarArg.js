const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpVarArg {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.VarArg && instruction.B > 2;
  }
  getObfuscated(context) {
    return "local A=Inst[OP_A];for Idx=0,Inst[OP_B]-2 do Stk[A+Idx]=Vararg[Idx];end;";
  }
}

class OpVarArgB0 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.VarArg && instruction.B === 0;
  }
  getObfuscated(context) {
    return "local A=Inst[OP_A];for Idx=0,Varargsz do Stk[A+Idx]=Vararg[Idx];end;";
  }
}

module.exports = { OpVarArg, OpVarArgB0 };
