const Opcode = require('../../ir/Opcode');
const Instruction = require('../../ir/Instruction');
const CFGenerator = require('./CFGenerator');

class Bounce {
  static doInstructions(chunk, instructions) {
    instructions = [...instructions];
    const gen = new CFGenerator();

    for (const l of instructions) {
      if (l.opCode !== Opcode.Jmp) continue;
      const first = gen.nextJMP(chunk, l.refOperands[0]);
      chunk.instructions.push(first);
      l.refOperands[0] = first;
    }
    chunk.updateMappings();
  }
}

module.exports = Bounce;
