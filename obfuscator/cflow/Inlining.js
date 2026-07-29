const { shuffle } = require('../../utils');
const Opcode = require('../../ir/Opcode');
const Instruction = require('../../ir/Instruction');
const Constant = require('../../ir/Constant');
const { InstructionType } = require('../../ir/Enums');

class Inlining {
  constructor(chunk) {
    this._head = chunk;
  }

  shouldInline(target, inlined) {
    const calls = [];
    const closures = [];
    let inlineAll = false;

    if (inlined.instructions.length < 3) return { result: false, calls, closures, inlineAll };

    if (inlined.instructions[0].opCode !== Opcode.GetGlobal ||
        inlined.instructions[1].opCode !== Opcode.LoadBool ||
        inlined.instructions[2].opCode !== Opcode.Call)
      return { result: false, calls, closures, inlineAll };

    if (!inlined.instructions[0].refOperands[0] ||
        inlined.instructions[0].refOperands[0].data.toString() !== 'IB_INLINING_START')
      return { result: false, calls, closures, inlineAll };

    inlineAll = inlined.instructions[1].B === 1;

    for (let k = 0; k < 3; k++) {
      inlined.instructions[k].opCode = Opcode.Move;
      inlined.instructions[k].A = 0;
      inlined.instructions[k].B = 0;
    }

    const constToRemove = inlined.instructions[0].refOperands[0];
    const ci = inlined.constants.indexOf(constToRemove);
    if (ci !== -1) inlined.constants.splice(ci, 1);

    if (target.stackSize + inlined.stackSize + 1 > 255)
      return { result: false, calls, closures, inlineAll };

    if (inlined.instructions.some(i => i.opCode === Opcode.GetUpval || i.opCode === Opcode.SetUpval))
      return { result: false, calls, closures, inlineAll };

    const registers = new Array(256).fill(false);
    let res = false;

    for (let i = 0; i < target.instructions.length; i++) {
      const instr = target.instructions[i];
      switch (instr.opCode) {
        case Opcode.Move:
          registers[instr.A] = registers[instr.B];
          break;
        case Opcode.LoadNil:
        case Opcode.Unm:
        case Opcode.Not:
        case Opcode.Len:
        case Opcode.TestSet:
          registers[instr.A] = false;
          registers[instr.B] = false;
          break;
        case Opcode.LoadConst:
        case Opcode.LoadBool:
        case Opcode.GetGlobal:
        case Opcode.SetGlobal:
        case Opcode.Return:
        case Opcode.VarArg:
        case Opcode.Test:
        case Opcode.ForPrep:
        case Opcode.ForLoop:
        case Opcode.TForLoop:
        case Opcode.NewTable:
        case Opcode.SetList:
        case Opcode.Close:
        case Opcode.GetTable:
        case Opcode.SetTable:
        case Opcode.Add:
        case Opcode.Sub:
        case Opcode.Mul:
        case Opcode.Div:
        case Opcode.Mod:
        case Opcode.Pow:
        case Opcode.Concat:
        case Opcode.Self:
          registers[instr.A] = false;
          break;
        case Opcode.Closure:
          if (instr.refOperands[0] === inlined) {
            closures.push(instr);
            registers[instr.A] = true;
          }
          break;
        case Opcode.Call:
        case Opcode.TailCall:
          let limit = instr.A + instr.C - 1;
          if (instr.C === 0) limit = target.stackSize;
          if (registers[instr.A]) {
            calls.push(instr);
            res = true;
          }
          for (let c = instr.A; c <= limit; c++) registers[c] = false;
          break;
      }
    }

    return { result: res, calls, closures, inlineAll };
  }

  doChunk(chunk) {
    const subs = [...chunk.functions];
    for (const sub of subs) {
      this.doChunk(sub);
      const { result, calls, closures, inlineAll } = this.shouldInline(chunk, sub);

      if (result) {
        if (inlineAll) {
          const fi = chunk.functions.indexOf(sub);
          if (fi !== -1) chunk.functions.splice(fi, 1);
        }

        for (const loc of calls) {
          let target = loc.A + loc.B + 1;
          if (loc.B === 0) target = chunk.stackSize + 1;

          sub.rebase(target, target);

          const modified = [];
          let idx = chunk.instructionMap.get(loc);
          chunk.instructions.splice(idx, 1);

          for (const bRef of loc.backReferences)
            bRef.setupRefs();
          chunk.updateMappings();

          const next = chunk.instructions[idx];

          let lim = sub.parameterCount - 1;
          if (loc.B === 0) lim = chunk.stackSize - loc.A;

          for (let i = 0; i <= lim; i++) {
            chunk.instructions.splice(idx++, new Instruction(chunk, Opcode.Move, {
              A: target + i,
              B: loc.A + i + 1
            }));
          }

          const map = new Map();
          let done = false;

          for (let i = 0; i < sub.instructions.length; i++) {
            const instr = Instruction.copy(sub.instructions[i]);
            instr.chunk = chunk;
            map.set(sub.instructions[i], instr);

            switch (instr.opCode) {
              case Opcode.Return: {
                let callLimit = loc.C - 1;
                if (callLimit === -1) callLimit = instr.B - 2;
                if (callLimit <= -1) callLimit = sub.stackSize;

                const t = [];
                for (let j = 0; j <= callLimit; j++)
                  t.push(new Instruction(chunk, Opcode.Move, { A: loc.A + j, B: instr.A + j }));

                const setTop = new Instruction(chunk, Opcode.SetTop);
                setTop.A = loc.A + callLimit;
                t.push(setTop);
                t.push(new Instruction(chunk, Opcode.Jmp, next));

                map.set(sub.instructions[i], t[0]);
                modified.push(...t);
                done = true;
                break;
              }
              case Opcode.TailCall: {
                let callLimit = loc.C - 1;
                if (callLimit === -1) callLimit = instr.B - 1;
                if (callLimit === -1) callLimit = chunk.stackSize - loc.A + 1;

                const t = [];
                for (let j = 0; j <= callLimit; j++)
                  t.push(new Instruction(chunk, Opcode.Move, { A: loc.A + j, B: instr.A + j }));

                instr.opCode = Opcode.Call;
                instr.A = loc.A;
                t.push(instr);
                t.push(new Instruction(chunk, Opcode.Jmp, next));

                map.set(sub.instructions[i], t[0]);
                modified.push(...t);
                done = true;
                break;
              }
              default:
                modified.push(instr);
                break;
            }
            if (done) break;
          }

          chunk.instructions.splice(idx, 0, ...modified);
          chunk.updateMappings();
        }

        for (const clos of closures) {
          const cIdx = chunk.instructionMap.get(clos);
          if (cIdx !== undefined)
            chunk.instructions.splice(cIdx, clos.refOperands[0].upvalueCount + 1);
          for (const bRef of clos.backReferences)
            bRef.setupRefs();
        }

        for (const c of sub.constants) {
          let nc = chunk.constants.find(c2 => c2.type === c.type && c2.data === c.data);
          if (!nc) {
            nc = c.clone();
            chunk.constants.push(nc);
          }
          for (const inst of chunk.instructions) {
            if (inst.refOperands[0] && inst.refOperands[0] === c) inst.refOperands[0] = nc;
            if (inst.refOperands[1] && inst.refOperands[1] === c) inst.refOperands[1] = nc;
          }
        }

        for (const c of sub.functions)
          chunk.functions.push(c);

        chunk.updateMappings();
        for (const _ins of chunk.instructions)
          _ins.updateRegisters();
      }
    }
  }

  doChunks() {
    this.doChunk(this._head);
  }
}

module.exports = Inlining;
