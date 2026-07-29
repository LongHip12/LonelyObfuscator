const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpSetList {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.SetList && instruction.B !== 0 && instruction.C !== 0;
  }
  getObfuscated(context) {
    return `local A = Inst[OP_A];
local T = Stk[A];
for Idx = A + 1, Inst[OP_B] do 
	Insert(T, Stk[Idx])
end;`;
  }
  mutate(instruction) {
    instruction.B += instruction.A;
  }
}

class OpSetListB0 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.SetList && instruction.B === 0;
  }
  getObfuscated(context) {
    return "";
  }
}

module.exports = { OpSetList, OpSetListB0 };
