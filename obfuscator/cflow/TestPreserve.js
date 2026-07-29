const { shuffle } = require('../../utils');
const Opcode = require('../../ir/Opcode');
const Instruction = require('../../ir/Instruction');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');
const CFGenerator = require('./CFGenerator');

class TestPreserve {
  static _used = [];

  static _nIntND(min, max) {
    const x = [];
    for (let i = min; i < max; i++) x.push(i);
    const filtered = x.filter(y => !TestPreserve._used.includes(y));
    shuffle(filtered);
    const n = filtered[0];
    TestPreserve._used.push(n);
    return n;
  }

  static doInstructions(chunk, instructions) {
    for (let idx = 0; idx < instructions.length; idx++) {
      TestPreserve._used = [];
      const i = instructions[idx];
      switch (i.opCode) {
        case Opcode.Lt:
        case Opcode.Le:
        case Opcode.Eq: {
          const mReg1 = 250;
          const mReg2 = 251;
          let ma, mb;

          if (i.refOperands[0] && i.refOperands[0].constructor && i.refOperands[0].constructor.name === 'Constant') {
            ma = new Instruction(chunk, Opcode.LoadConst, i.refOperands[0]);
            ma.A = mReg1;
          } else {
            ma = new Instruction(chunk, Opcode.Move);
            ma.A = mReg1;
            ma.B = i.B;
          }

          if (i.refOperands[1] && i.refOperands[1].constructor && i.refOperands[1].constructor.name === 'Constant') {
            mb = new Instruction(chunk, Opcode.LoadConst, i.refOperands[1]);
            mb.A = mReg2;
          } else {
            mb = new Instruction(chunk, Opcode.Move);
            mb.A = mReg2;
            mb.B = i.C;
          }

          const loadbool1 = new Instruction(chunk, Opcode.LoadBool);
          loadbool1.A = mReg1; loadbool1.B = 0;

          const loadbool2 = new Instruction(chunk, Opcode.LoadBool);
          loadbool2.A = mReg2; loadbool2.B = 0;

          i.B = mReg1;
          i.C = mReg2;
          i.setupRefs();

          const iIdx = chunk.instructionMap.get(i);
          chunk.instructions.splice(iIdx + 2, 0, Instruction.copy(loadbool1), Instruction.copy(loadbool2));
          chunk.instructions.splice(iIdx, 0, ma, mb);
          chunk.updateMappings();

          const jmpTarget = chunk.instructions[chunk.instructionMap.get(i) + 1].refOperands[0];
          chunk.instructions.splice(chunk.instructionMap.get(jmpTarget), 0, loadbool1, loadbool2);
          chunk.instructions[chunk.instructionMap.get(i) + 1].refOperands[0] = loadbool1;
          chunk.updateMappings();

          for (const ins of i.backReferences)
            ins.refOperands[0] = ma;
          break;
        }
        case Opcode.Test:
        case Opcode.TestSet: {
          const rReg = TestPreserve._nIntND(0, 128);
          const pReg = TestPreserve._nIntND(257, 512);

          const m1 = new Instruction(chunk, Opcode.Move);
          m1.A = pReg; m1.B = rReg;

          const m2 = new Instruction(chunk, Opcode.Move);
          m2.A = rReg; m2.B = i.A;

          const lb = new Instruction(chunk, Opcode.LoadBool);
          lb.A = pReg; lb.B = 0;

          const m3 = new Instruction(chunk, Opcode.Move);
          m3.A = rReg; m3.B = pReg;

          const iIdx = chunk.instructionMap.get(i);
          chunk.instructions.splice(iIdx + 2, 0, Instruction.copy(m3), Instruction.copy(lb));
          chunk.instructions.splice(iIdx, 0, m1, m2);
          chunk.updateMappings();

          const jmpTarget = chunk.instructions[chunk.instructionMap.get(i) + 1].refOperands[0];
          chunk.instructions.splice(chunk.instructionMap.get(jmpTarget), 0, m3, lb);
          chunk.instructions[chunk.instructionMap.get(i) + 1].refOperands[0] = m3;
          chunk.updateMappings();

          for (const ins of i.backReferences)
            ins.refOperands[0] = m1;
          break;
        }
      }
    }
  }
}

module.exports = TestPreserve;
