const Opcode = require('../../ir/Opcode');
const Instruction = require('../../ir/Instruction');
const CFGenerator = require('./CFGenerator');

class TestSpam {
  static doInstructions(chunk, instructions) {
    instructions = [...instructions];
    const gen = new CFGenerator();

    for (let i = instructions.length - 1; i >= 0; i--) {
      const instr = instructions[i];

      switch (instr.opCode) {
        case Opcode.Eq:
        case Opcode.Lt:
        case Opcode.Le: {
          const AddTVGroup = (test) => {
            const cmp1 = Instruction.copy(test);
            const targetIdx = chunk.instructionMap.get(test) + 1;
            const target = chunk.instructions[targetIdx];

            const jmpCorrect = gen.nextJMP(chunk, target.refOperands[0]);
            const jmpJunk = gen.nextJMP(chunk, instructions[Math.floor(Math.random() * (i - 2))]);

            target.refOperands[0] = cmp1;
            chunk.instructions.push(cmp1, jmpCorrect, jmpJunk);

            const cmp2 = Instruction.copy(test);
            const targetIdx2 = chunk.instructionMap.get(test) + 2;
            const target2 = chunk.instructions[targetIdx2];

            const jmpCorrect2 = gen.nextJMP(chunk, target2);
            const jmpJunk2 = gen.nextJMP(chunk, instructions[Math.floor(Math.random() * (i - 2))]);
            const jmpStart = gen.nextJMP(chunk, cmp2);

            const tIdx = chunk.instructionMap.get(target2);
            chunk.instructions.splice(tIdx, 0, jmpStart);
            chunk.instructions.push(cmp2, jmpJunk2, jmpCorrect2);

            chunk.updateMappings();
            return [cmp1, cmp2];
          };

          let tv1 = AddTVGroup(instr);
          for (let j = 0; j < 3; j++) {
            const tv2 = [];
            for (const ins of tv1)
              tv2.push(...AddTVGroup(ins));
            tv1 = tv2;
          }
          break;
        }

        case Opcode.Test:
        case Opcode.TestSet: {
          const AddTVGroup = (test) => {
            const test1 = Instruction.copy(test);
            const targetIdx = chunk.instructionMap.get(test) + 1;
            const target = chunk.instructions[targetIdx];

            const jmpCorrect = gen.nextJMP(chunk, target.refOperands[0]);
            const jmpJunk = gen.nextJMP(chunk, instructions[Math.floor(Math.random() * (i - 2))]);

            target.refOperands[0] = test1;
            chunk.instructions.push(test1, jmpCorrect, jmpJunk);

            const test2 = Instruction.copy(test);
            const targetIdx2 = chunk.instructionMap.get(test) + 2;
            const target2 = chunk.instructions[targetIdx2];

            const jmpCorrect2 = gen.nextJMP(chunk, target2);
            const jmpJunk2 = gen.nextJMP(chunk, instructions[Math.floor(Math.random() * (i - 2))]);
            const jmpStart = gen.nextJMP(chunk, test2);

            const tIdx = chunk.instructionMap.get(target2);
            chunk.instructions.splice(tIdx, 0, jmpStart);
            chunk.instructions.push(test2, jmpJunk2, jmpCorrect2);

            chunk.updateMappings();
            return [test1, test2];
          };

          let tv1 = AddTVGroup(instr);
          for (let j = 0; j < 3; j++) {
            const x = tv1.length;
            for (let index = 0; index < x; index++)
              tv1.push(...AddTVGroup(tv1[index]));
          }
          break;
        }
      }
    }
    chunk.updateMappings();
  }
}

module.exports = TestSpam;
