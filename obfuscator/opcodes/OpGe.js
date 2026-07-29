const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpGe {
  constructor() { this.VIndex = 0; }

  isInstruction(instruction) {
    return instruction.opCode == Opcode.Lt && instruction.A != 0 && instruction.B <= 255 && instruction.C <= 255;
  }

  getObfuscated(context) {
    return "if (Stk[Inst[OP_A]]<Stk[Inst[OP_C]])then InstrPoint=Inst[OP_B]; else InstrPoint=InstrPoint+1; end;";
  }

  mutate(instruction) {
    instruction.A = instruction.B;
    instruction.B = instruction.pc + instruction.chunk.instructions[instruction.pc + 1].B + 2;
    instruction.instructionType = InstructionType.AsBxC;
  }
}

class OpGeB {
  constructor() { this.VIndex = 0; }

  isInstruction(instruction) {
    return instruction.opCode == Opcode.Lt && instruction.A != 0 && instruction.B > 255 && instruction.C <= 255;
  }

  getObfuscated(context) {
    return "if (Inst[OP_A] < Stk[Inst[OP_C]]) then InstrPoint=Inst[OP_B]; else InstrPoint=InstrPoint+1; end;";
  }

  mutate(instruction) {
    instruction.A = instruction.B - 255;
    instruction.B = instruction.pc + instruction.chunk.instructions[instruction.pc + 1].B + 2;
    instruction.instructionType = InstructionType.AsBxC;
    instruction.constantMask |= InstructionConstantMask.RA;
  }
}

class OpGeC {
  constructor() { this.VIndex = 0; }

  isInstruction(instruction) {
    return instruction.opCode == Opcode.Lt && instruction.A != 0 && instruction.B <= 255 && instruction.C > 255;
  }

  getObfuscated(context) {
    return "if (Stk[Inst[OP_A]] < Inst[OP_C]) then InstrPoint=Inst[OP_B]; else InstrPoint=InstrPoint+1; end;";
  }

  mutate(instruction) {
    instruction.A = instruction.B;
    instruction.C -= 255;
    instruction.B = instruction.pc + instruction.chunk.instructions[instruction.pc + 1].B + 2;
    instruction.instructionType = InstructionType.AsBxC;
    instruction.constantMask |= InstructionConstantMask.RC;
  }
}

class OpGeBC {
  constructor() { this.VIndex = 0; }

  isInstruction(instruction) {
    return instruction.opCode == Opcode.Lt && instruction.A != 0 && instruction.B > 255 && instruction.C > 255;
  }

  getObfuscated(context) {
    return "if (Inst[OP_A] < Inst[OP_C]) then InstrPoint=Inst[OP_B]; else InstrPoint=InstrPoint+1; end;";
  }

  mutate(instruction) {
    instruction.A = instruction.B - 255;
    instruction.C -= 255;
    instruction.B = instruction.pc + instruction.chunk.instructions[instruction.pc + 1].B + 2;
    instruction.instructionType = InstructionType.AsBxC;
    instruction.constantMask |= InstructionConstantMask.RA | InstructionConstantMask.RC;
  }
}

module.exports = { OpGe, OpGeB, OpGeC, OpGeBC };
