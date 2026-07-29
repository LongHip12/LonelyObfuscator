const Opcode = require('../../ir/Opcode');
const Constant = require('../../ir/Constant');
const TestFlip = require('./TestFlip');
const TestSpam = require('./TestSpam');
const Bounce = require('./Bounce');
const Inlining = require('./Inlining');

class CFContext {
  constructor(lChunk) {
    this.lChunk = lChunk;
  }

  doChunk(c) {
    let chunkHasCflow = false;
    let CBegin = null;
    const Instructs = [...c.instructions];

    for (let index = 0; index < Instructs.length - 1; index++) {
      const instr = Instructs[index];
      if (instr.opCode === Opcode.GetGlobal && Instructs[index + 1].opCode === Opcode.Call) {
        const str = instr.refOperands[0] ? instr.refOperands[0].data.toString() : '';
        let do_ = false;

        switch (str) {
          case 'IB_MAX_CFLOW_START':
            CBegin = instr;
            do_ = true;
            chunkHasCflow = true;
            break;
          case 'IB_MAX_CFLOW_END':
            do_ = true;
            if (CBegin) {
              let cBegin = c.instructionMap.get(CBegin);
              let cEnd = c.instructionMap.get(instr);
              let nIns = c.instructions.slice(cBegin, cEnd);

              TestSpam.doInstructions(c, nIns);
              cBegin = c.instructionMap.get(CBegin);
              cEnd = c.instructionMap.get(instr);
              nIns = c.instructions.slice(cBegin, cEnd);

              Bounce.doInstructions(c, nIns);
            }
            break;
        }

        if (do_) {
          instr.opCode = Opcode.Move;
          instr.A = 0;
          instr.B = 0;
          const call = Instructs[index + 1];
          call.opCode = Opcode.Move;
          call.A = 0;
          call.B = 0;
        }
      }
    }

    TestFlip.doInstructions(c, [...c.instructions]);

    if (chunkHasCflow)
      c.instructions.unshift(new Instruction(c, Opcode.NewStack));

    for (const _c of c.functions)
      this.doChunk(_c);
  }

  doChunks() {
    new Inlining(this.lChunk).doChunks();
    this.doChunk(this.lChunk);
  }
}

module.exports = CFContext;
