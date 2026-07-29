const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpForPrep {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.ForPrep;
  }
  getObfuscated(context) {
    return "local A = Inst[OP_A];local Index = Stk[A]\nlocal Step = Stk[A + 2];\nif (Step > 0) then \tif (Index > Stk[A+1]) then\n\t\tInstrPoint = Inst[OP_B];\n\telse\n\t\tStk[A+3] = Index;\n\tend\nelseif (Index < Stk[A+1]) then\n\tInstrPoint = Inst[OP_B];\nelse\n\tStk[A+3] = Index;\nend\n";
  }
  mutate(instruction) {
    instruction.B += instruction.pc + 2;
  }
}

module.exports = { OpForPrep };
