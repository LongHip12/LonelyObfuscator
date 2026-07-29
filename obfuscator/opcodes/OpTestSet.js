const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpTestSet {
  constructor() { this.VIndex = 0; }

  isInstruction(instruction) {
    return instruction.opCode == Opcode.TestSet && instruction.C == 0;
  }

  getObfuscated(context) {
    return "if(not Stk[Inst[OP_A]])then InstrPoint=Inst[OP_B];else Stk[Inst[OP_C]]=Stk[Inst[OP_A]];InstrPoint=InstrPoint+1;end;";
  }
}

class OpTestSetC {
  constructor() { this.VIndex = 0; }

  isInstruction(instruction) {
    return instruction.opCode == Opcode.TestSet && instruction.C != 0;
  }

  getObfuscated(context) {
    return "if(Stk[Inst[OP_A]])then InstrPoint=Inst[OP_B];else Stk[Inst[OP_C]]=Stk[Inst[OP_A]];InstrPoint=InstrPoint+1;end;";
  }

  mutate(instruction) {
    instruction.C = 0;
  }
}

module.exports = { OpTestSet, OpTestSetC };
