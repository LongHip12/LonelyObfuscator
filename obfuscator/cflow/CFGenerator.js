const { shuffle, randInt } = require('../../utils');
const Opcode = require('../../ir/Opcode');
const Instruction = require('../../ir/Instruction');

class CFGenerator {
  constructor() {
    this.random = Math.random;
  }

  nextJMP(lc, reference) {
    return new Instruction(lc, Opcode.Jmp, reference);
  }

  believableRandom(lc) {
    let ins = new Instruction(lc, Math.floor(Math.random() * 37));
    ins.A = Math.floor(Math.random() * 128);
    ins.B = Math.floor(Math.random() * 128);
    ins.C = Math.floor(Math.random() * 128);

    while (true) {
      switch (ins.opCode) {
        case Opcode.LoadConst:
        case Opcode.GetGlobal:
        case Opcode.SetGlobal:
        case Opcode.Jmp:
        case Opcode.ForLoop:
        case Opcode.TForLoop:
        case Opcode.ForPrep:
        case Opcode.Closure:
        case Opcode.GetTable:
        case Opcode.SetTable:
        case Opcode.Add:
        case Opcode.Sub:
        case Opcode.Mul:
        case Opcode.Div:
        case Opcode.Mod:
        case Opcode.Pow:
        case Opcode.Test:
        case Opcode.TestSet:
        case Opcode.Eq:
        case Opcode.Lt:
        case Opcode.Le:
        case Opcode.Self:
          ins = new Instruction(lc, Math.floor(Math.random() * 37));
          ins.A = Math.floor(Math.random() * 128);
          ins.B = Math.floor(Math.random() * 128);
          ins.C = Math.floor(Math.random() * 128);
          continue;
        default:
          return ins;
      }
    }
  }

  getOrAddConstant(chunk, type, constant) {
    const existing = chunk.constants.find(c => c.type === type && c.data === constant);
    if (existing) return { constant: existing, index: chunk.constantMap.get(existing) };

    const newConst = { type, data: constant, backReferences: [] };
    const index = chunk.constants.length;
    chunk.constants.push(newConst);
    chunk.constantMap.set(newConst, index);
    return { constant: newConst, index };
  }
}

module.exports = CFGenerator;
