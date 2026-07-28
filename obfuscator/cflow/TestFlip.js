const { shuffle } = require('../../utils');
const Opcode = require('../../ir/Opcode');
const Instruction = require('../../ir/Instruction');
const { InstructionType } = require('../../ir/Enums');

class TestFlip {
  static doInstructions(chunk, instructions) {
    instructions = [...instructions];
    const CFGenerator = require('./CFGenerator');
    const gen = new CFGenerator();

    for (let idx = instructions.length - 1; idx >= 0; idx--) {
      const i = instructions[idx];
      switch (i.opCode) {
        case Opcode.Lt:
        case Opcode.Le:
        case Opcode.Eq:
          if (Math.floor(Math.random() * 2) === 1) {
            i.A = i.A === 0 ? 1 : 0;
            const nJmp = gen.nextJMP(chunk, instructions[idx + 2]);
            const insIdx = chunk.instructionMap.get(i);
            chunk.instructions.splice(insIdx + 1, 0, nJmp);
          }
          break;
        case Opcode.Test:
          if (Math.floor(Math.random() * 2) === 1) {
            i.C = i.C === 0 ? 1 : 0;
            const nJmp = gen.nextJMP(chunk, instructions[idx + 2]);
            const insIdx = chunk.instructionMap.get(i);
            chunk.instructions.splice(insIdx + 1, 0, nJmp);
          }
          break;
      }
    }
    chunk.updateMappings();
  }
}

module.exports = TestFlip;
