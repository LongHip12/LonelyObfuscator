const { InstructionType, InstructionConstantMask } = require('./Enums');
const Opcode = require('./Opcode');

class Instruction {
  constructor(chunk, opcode, ...refOperands) {
    this.chunk = chunk;
    this.opCode = opcode !== undefined ? opcode : 0;
    const Deserializer = require('../bytecode/Deserializer');
    const mappings = Deserializer.InstructionMappings;
    this.instructionType = mappings && mappings[opcode] !== undefined ? mappings[opcode] : InstructionType.ABC;
    this.constantMask = InstructionConstantMask.NK;
    this.A = 0;
    this.B = 0;
    this.C = 0;
    this.data = 0;
    this.pc = 0;
    this.line = 0;
    this.customData = null;
    this.refOperands = [null, null, null];
    this.backReferences = [];

    if (refOperands.length > 0) {
      for (let i = 0; i < refOperands.length; i++) {
        const op = refOperands[i];
        this.refOperands[i] = op;
        if (op instanceof Instruction) {
          op.backReferences.push(this);
        }
      }
    }
  }

  static copy(other) {
    const i = new Instruction(other.chunk, other.opCode);
    i.refOperands = [...other.refOperands];
    i.backReferences = [...other.backReferences];
    i.instructionType = other.instructionType;
    i.constantMask = other.constantMask;
    i.A = other.A;
    i.B = other.B;
    i.C = other.C;
    i.data = other.data;
    i.pc = other.pc;
    i.line = other.line;
    i.customData = other.customData;
    return i;
  }

  updateRegisters() {
    if (this.instructionType === InstructionType.Data) return;
    this.pc = this.chunk.instructionMap.get(this);
    switch (this.opCode) {
      case Opcode.LoadConst:
      case Opcode.GetGlobal:
      case Opcode.SetGlobal:
        this.B = this.chunk.constantMap.get(this.refOperands[0]);
        break;
      case Opcode.Jmp:
      case Opcode.ForLoop:
      case Opcode.ForPrep:
        this.B = this.chunk.instructionMap.get(this.refOperands[0]) - this.pc - 1;
        break;
      case Opcode.Closure:
        this.B = this.chunk.functionMap.get(this.refOperands[0]);
        break;
      case Opcode.GetTable:
      case Opcode.SetTable:
      case Opcode.Add:
      case Opcode.Sub:
      case Opcode.Mul:
      case Opcode.Div:
      case Opcode.Mod:
      case Opcode.Pow:
      case Opcode.Eq:
      case Opcode.Lt:
      case Opcode.Le:
      case Opcode.Self:
        if (this.refOperands[0]) {
          if (this.refOperands[0].constructor.name === 'Constant')
            this.B = this.chunk.constantMap.get(this.refOperands[0]) + 256;
          else if (this.refOperands[0] instanceof Instruction)
            this.B = this.chunk.instructionMap.get(this.refOperands[0]);
        }
        if (this.refOperands[1]) {
          if (this.refOperands[1].constructor.name === 'Constant')
            this.C = this.chunk.constantMap.get(this.refOperands[1]) + 256;
          else if (this.refOperands[1] instanceof Instruction)
            this.C = this.chunk.instructionMap.get(this.refOperands[1]);
        }
        break;
    }
  }

  setupRefs() {
    this.refOperands = [null, null, null];
    switch (this.opCode) {
      case Opcode.LoadConst:
      case Opcode.GetGlobal:
      case Opcode.SetGlobal:
        this.refOperands[0] = this.chunk.constants[this.B];
        if (this.refOperands[0])
          this.refOperands[0].backReferences.push(this);
        break;
      case Opcode.Jmp:
      case Opcode.ForLoop:
      case Opcode.ForPrep:
        this.refOperands[0] = this.chunk.instructions[this.chunk.instructionMap.get(this) + this.B + 1];
        if (this.refOperands[0])
          this.refOperands[0].backReferences.push(this);
        break;
      case Opcode.Closure:
        this.refOperands[0] = this.chunk.functions[this.B];
        break;
      case Opcode.GetTable:
      case Opcode.SetTable:
      case Opcode.Add:
      case Opcode.Sub:
      case Opcode.Mul:
      case Opcode.Div:
      case Opcode.Mod:
      case Opcode.Pow:
      case Opcode.Eq:
      case Opcode.Lt:
      case Opcode.Le:
      case Opcode.Self:
        if (this.B > 255) this.refOperands[0] = this.chunk.constants[this.B - 256];
        if (this.C > 255) this.refOperands[1] = this.chunk.constants[this.C - 256];
        break;
    }
  }
}

module.exports = Instruction;
