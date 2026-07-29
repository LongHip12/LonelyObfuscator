const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpLoadBool {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.LoadBool && instruction.C === 0;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]]=(Inst[OP_B]~=0);';
  }
}

class OpLoadBoolC {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.LoadBool && instruction.C !== 0;
  }
  getObfuscated(context) {
    return 'Stk[Inst[OP_A]]=(Inst[OP_B]~=0);InstrPoint=InstrPoint+1;';
  }
  mutate(instruction) {
    instruction.C = 0;
  }
}

module.exports = { OpLoadBool, OpLoadBoolC };
