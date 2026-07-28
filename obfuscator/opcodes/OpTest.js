const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpTest {
  constructor() { this.VIndex = 0; }

  isInstruction(instruction) {
    return instruction.opCode == Opcode.Test && instruction.C == 0;
  }

  getObfuscated(context) {
    return "if(not Stk[Inst[OP_A]])then InstrPoint=Inst[OP_B];else InstrPoint=InstrPoint+1;end;";
  }
}

class OpTestC {
  constructor() { this.VIndex = 0; }

  isInstruction(instruction) {
    return instruction.opCode == Opcode.Test && instruction.C != 0;
  }

  getObfuscated(context) {
    return "if(Stk[Inst[OP_A]])then InstrPoint=Inst[OP_B];else InstrPoint=InstrPoint+1;end;";
  }

  mutate(instruction) {
    instruction.C = 0;
  }
}

module.exports = { OpTest, OpTestC };
