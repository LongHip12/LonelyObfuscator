const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpClosureNU {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Closure && instruction.chunk.functions[instruction.B] && instruction.chunk.functions[instruction.B].upvalueCount === 0;
  }
  getObfuscated(context) {
    return "Stk[Inst[OP_A]]=Wrap(Proto[Inst[OP_B]],nil,Env);";
  }
}

module.exports = { OpClosureNU };
