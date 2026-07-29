const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpJmp {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Jmp;
  }
  getObfuscated(context) {
    return 'InstrPoint=Inst[OP_B];';
  }
  mutate(instruction) {
    instruction.B += instruction.pc + 1;
  }
}

module.exports = { OpJmp };
