const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpForLoop {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.ForLoop;
  }
  getObfuscated(context) {
    return "local A = Inst[OP_A];local Step = Stk[A + 2];local Index = Stk[A] + Step;Stk[A] = Index;if (Step > 0) then \tif (Index <= Stk[A+1]) then\n\t\tInstrPoint = Inst[OP_B];\n\t\tStk[A+3] = Index;\n\tend\nelseif (Index >= Stk[A+1]) then\n\tInstrPoint = Inst[OP_B];\n\tStk[A+3] = Index;\nend\n";
  }
  mutate(instruction) {
    instruction.B += instruction.pc + 1;
  }
}

module.exports = { OpForLoop };
