'use strict';
const { Compress, CompressedToString, toBase36 } = require('./compress');
const { shuffle, randInt } = require('../../utils');
const Opcode = require('../../ir/Opcode');
const Instruction = require('../../ir/Instruction');
const Serializer = require('../../bytecode/Serializer');
const { OpSuperOperator } = require('../opcodes/OpSuperOperator');
const { OpMutated } = require('../opcodes/OpMutated');

class Generator {
  constructor(context) {
    this._context = context;
  }

  isUsed(chunk, virt) {
    let isUsed = false;
    for (const ins of chunk.instructions) {
      if (virt.isInstruction(ins)) {
        if (!this._context.instructionMapping.has(ins.opCode))
          this._context.instructionMapping.set(ins.opCode, virt);
        ins.customData = { opcode: virt, writtenOpcode: null };
        isUsed = true;
      }
    }
    for (const sChunk of chunk.functions)
      if (this.isUsed(sChunk, virt)) isUsed = true;
    return isUsed;
  }

  generateMutations(opcodes) {
    const mutated = [];
    for (const opc of opcodes) {
      if (opc instanceof OpSuperOperator) continue;
      const count = randInt(35, 50);
      for (let i = 0; i < count; i++) {
        const registers = [0, 1, 2];
        shuffle(registers);
        const mut = new OpMutated();
        mut.registers = registers;
        mut.mutated = opc;
        mutated.push(mut);
      }
    }
    shuffle(mutated);
    return mutated;
  }

  foldMutations(mutations, used, chunk) {
    const skip = new Array(chunk.instructions.length + 1).fill(false);
    for (let i = 0; i < chunk.instructions.length; i++) {
      const opc = chunk.instructions[i];
      if (opc.opCode === Opcode.Closure) {
        const ch = opc.refOperands[0];
        if (ch) for (let j = 1; j <= ch.upvalueCount; j++) skip[i + j] = true;
      }
    }
    for (let i = 0; i < chunk.instructions.length; i++) {
      if (skip[i]) continue;
      const data = chunk.instructions[i].customData;
      if (!data) continue;
      for (const mut of mutations) {
        if (data.opcode === mut.mutated && data.writtenOpcode === null) {
          if (!used.has(mut)) used.add(mut);
          data.opcode = mut;
          break;
        }
      }
    }
    for (const _c of chunk.functions)
      this.foldMutations(mutations, used, _c);
  }

  generateSuperOperators(chunk, maxSize, minSize) {
    minSize = minSize || 5;
    const results = [];
    const skip = new Array(chunk.instructions.length + 1).fill(false);
    for (let i = 0; i < chunk.instructions.length - 1; i++) {
      switch (chunk.instructions[i].opCode) {
        case Opcode.Closure: {
          skip[i] = true;
          const ch = chunk.instructions[i].refOperands[0];
          if (ch) for (let j = 0; j < ch.upvalueCount; j++) skip[i + j + 1] = true;
          break;
        }
        case Opcode.Eq: case Opcode.Lt: case Opcode.Le:
        case Opcode.Test: case Opcode.TestSet: case Opcode.TForLoop:
        case Opcode.SetList: skip[i + 1] = true; break;
        case Opcode.LoadBool:
          if (chunk.instructions[i].C !== 0) skip[i + 1] = true;
          break;
        case Opcode.ForLoop: case Opcode.ForPrep: case Opcode.Jmp:
          chunk.instructions[i].updateRegisters();
          skip[i + 1] = true;
          skip[i + chunk.instructions[i].B + 1] = true;
          break;
      }
      const cd = chunk.instructions[i].customData;
      if (cd && cd.writtenOpcode instanceof OpSuperOperator && cd.writtenOpcode.subOpcodes)
        for (let j = 0; j < cd.writtenOpcode.subOpcodes.length; j++) skip[i + j] = true;
    }
    let c = 0;
    while (c < chunk.instructions.length) {
      let targetCount = maxSize;
      let superOp = new OpSuperOperator();
      superOp.subOpcodes = new Array(targetCount);
      let d = true;
      let cutoff = targetCount;
      for (let j = 0; j < targetCount; j++) {
        if (c + j > chunk.instructions.length - 1 || skip[c + j] || !chunk.instructions[c + j].customData) {
          cutoff = j; d = false; break;
        }
      }
      if (!d) {
        if (cutoff < minSize) { c += cutoff + 1; continue; }
        targetCount = cutoff;
        superOp = new OpSuperOperator();
        superOp.subOpcodes = new Array(targetCount);
        for (let j = 0; j < targetCount; j++) {
          if (!chunk.instructions[c + j].customData) { targetCount = j; break; }
        }
        if (targetCount < minSize) { c += targetCount + 1; continue; }
        superOp.subOpcodes = superOp.subOpcodes.slice(0, targetCount);
      }
      for (let j = 0; j < targetCount; j++) {
        const cd = chunk.instructions[c + j].customData;
        superOp.subOpcodes[j] = cd ? cd.opcode : null;
      }
      if (superOp.subOpcodes.some(s => s === null)) { c += targetCount + 1; continue; }
      results.push(superOp);
      c += targetCount + 1;
    }
    for (const _c of chunk.functions)
      results.push(...this.generateSuperOperators(_c, maxSize, minSize));
    return results;
  }

  foldAdditionalSuperOperators(chunk, operators, folded) {
    const skip = new Array(chunk.instructions.length + 1).fill(false);
    for (let i = 0; i < chunk.instructions.length - 1; i++) {
      switch (chunk.instructions[i].opCode) {
        case Opcode.Closure: {
          skip[i] = true;
          const ch = chunk.instructions[i].refOperands[0];
          if (ch) for (let j = 0; j < ch.upvalueCount; j++) skip[i + j + 1] = true;
          break;
        }
        case Opcode.Eq: case Opcode.Lt: case Opcode.Le:
        case Opcode.Test: case Opcode.TestSet: case Opcode.TForLoop:
        case Opcode.SetList: skip[i + 1] = true; break;
        case Opcode.LoadBool:
          if (chunk.instructions[i].C !== 0) skip[i + 1] = true;
          break;
        case Opcode.ForLoop: case Opcode.ForPrep: case Opcode.Jmp:
          chunk.instructions[i].updateRegisters();
          skip[i + 1] = true;
          skip[i + chunk.instructions[i].B + 1] = true;
          break;
      }
      const cd = chunk.instructions[i].customData;
      if (cd && cd.writtenOpcode instanceof OpSuperOperator && cd.writtenOpcode.subOpcodes)
        for (let j = 0; j < cd.writtenOpcode.subOpcodes.length; j++) skip[i + j] = true;
    }
    let c = 0;
    while (c < chunk.instructions.length) {
      if (skip[c]) { c++; continue; }
      let used = false;
      for (const op of operators) {
        const targetCount = op.subOpcodes.length;
        let cu = true;
        for (let j = 0; j < targetCount; j++) {
          if (c + j > chunk.instructions.length - 1 || skip[c + j]) { cu = false; break; }
        }
        if (!cu) continue;
        const taken = chunk.instructions.slice(c, c + targetCount);
        if (op.isInstruction(taken)) {
          for (let j = 0; j < targetCount; j++) {
            skip[c + j] = true;
            chunk.instructions[c + j].customData.writtenOpcode = new OpSuperOperator();
          }
          chunk.instructions[c].customData.writtenOpcode = op;
          used = true;
          break;
        }
      }
      if (!used) c++; else folded.count++;
    }
    for (const _c of chunk.functions)
      this.foldAdditionalSuperOperators(_c, operators, folded);
  }

  generateVM(settings) {
    const allOpcodes = require('../opcodes');
    const virtuals = [];
    for (const OpClass of allOpcodes) {
      const inst = new OpClass();
      if (this.isUsed(this._context.headChunk, inst))
        virtuals.push(inst);
    }

    if (settings.mutate) {
      const muts = this.generateMutations(virtuals).slice(0, settings.maxMutations);
      const used = new Set();
      this.foldMutations(muts, used, this._context.headChunk);
      virtuals.push(...used);
    }

    if (settings.superOperators) {
      let folded = { count: 0 };
      const megaOperators = this.generateSuperOperators(this._context.headChunk, 80, 60);
      shuffle(megaOperators);
      const megaSlice = megaOperators.slice(0, settings.maxMegaSuperOperators);
      virtuals.push(...megaSlice);
      this.foldAdditionalSuperOperators(this._context.headChunk, megaSlice, folded);

      folded = { count: 0 };
      const miniOperators = this.generateSuperOperators(this._context.headChunk, 10);
      shuffle(miniOperators);
      const miniSlice = miniOperators.slice(0, settings.maxMiniSuperOperators);
      virtuals.push(...miniSlice);
      this.foldAdditionalSuperOperators(this._context.headChunk, miniSlice, folded);
    }

    shuffle(virtuals);
    for (let i = 0; i < virtuals.length; i++) virtuals[i].VIndex = i;

    const bs = new Serializer(this._context, settings).serializeLChunk(this._context.headChunk);

    const VMStrings = require('./VMStrings');
    const { makeVMP1, deadCodeBlock, spreadConst } = VMStrings;
    const { ChunkStep } = require('../ObfuscationContext');

    const xorKey = this._context.primaryXorKey;
    const cBool  = this._context.constantMapping[1];
    const cFloat = this._context.constantMapping[2];
    const cStr   = this._context.constantMapping[3];

    let vm = '';
    vm += `local Byte=string.byte;local Char=string.char;local Sub=string.sub;local Concat=table.concat;local Insert=table.insert;local LDExp=math.ldexp;local GetFEnv=getfenv or function()return _ENV end;local Setmetatable=setmetatable;local Select=select;local Unpack=unpack or table.unpack;local ToNumber=tonumber;`;

    if (settings.bytecodeCompress) {
      const compressed = Compress(bs);
      const compStr = CompressedToString(compressed);
      vm += `local function decompress(b)local c,d,e="","",{}local f=${spreadConst(256)};local g={}for h=0,f-1 do g[h]=Char(h)end;local i=1;local function k()local l=ToNumber(Sub(b,i,i),${spreadConst(36)})i=i+1;local m=ToNumber(Sub(b,i,i+l-1),36)i=i+l;return m end;c=Char(k())e[1]=c;while i<#b do local n=k()if g[n]then d=g[n]else d=c..Sub(c,1,1)end;g[f]=c..Sub(d,1,1)e[#e+1],c,f=d,d,f+1 end;return table.concat(e)end;`;
      vm += `local ByteString=decompress('${compStr}');\n`;
    } else {
      const parts = [];
      for (let i = 0; i < bs.length; i++) parts.push('\\' + bs[i]);
      vm += `local ByteString='${parts.join('')}';\n`;
    }

    vm += makeVMP1(xorKey)
      .replace(/XOR_KEY/g, spreadConst(xorKey))
      .replace(/CONST_BOOL/g,  cBool.toString())
      .replace(/CONST_FLOAT/g, cFloat.toString())
      .replace(/CONST_STRING/g, cStr.toString());

    for (let i = 0; i < ChunkStep.StepCount; i++) {
      switch (this._context.chunkSteps[i]) {
        case ChunkStep.ParameterCount:
          vm += 'Chunk[3]=gBits8();';
          break;
        case ChunkStep.Instructions:
          vm += `for Idx=1,gBits32() do local Descriptor=gBits8();if(gBit(Descriptor,1,1)==0) then local Type=gBit(Descriptor,2,3);local Mask=gBit(Descriptor,4,6);local Inst={gBits16(),gBits16(),nil,nil};if(Type==0) then Inst[OP_B]=gBits16();Inst[OP_C]=gBits16();elseif(Type==1) then Inst[OP_B]=gBits32();elseif(Type==2) then Inst[OP_B]=gBits32()-(2^16);elseif(Type==3) then Inst[OP_B]=gBits32()-(2^16);Inst[OP_C]=gBits16();end;if(gBit(Mask,1,1)==1) then Inst[OP_A]=Consts[Inst[OP_A]]end;if(gBit(Mask,2,2)==1) then Inst[OP_B]=Consts[Inst[OP_B]]end;if(gBit(Mask,3,3)==1) then Inst[OP_C]=Consts[Inst[OP_C]]end;Instrs[Idx]=Inst;end;end;`;
          break;
        case ChunkStep.Functions:
          vm += 'for Idx=1,gBits32() do Functions[Idx-1]=Deserialize();end;';
          break;
        case ChunkStep.LineInfo:
          if (settings.preserveLineInfo)
            vm += 'for Idx=1,gBits32() do Lines[Idx]=gBits32();end;';
          break;
      }
    }

    vm += 'return Chunk;end;';
    vm += settings.preserveLineInfo ? VMStrings.VMP2_LI : VMStrings.VMP2;

    const getStr = (opcodes) => {
      let str = '';
      if (opcodes.length === 1) {
        str += virtuals[opcodes[0]].getObfuscated(this._context);
      } else if (opcodes.length === 2) {
        if (Math.floor(Math.random() * 2) === 0) {
          str += `if Enum>${virtuals[opcodes[0]].VIndex} then ${virtuals[opcodes[1]].getObfuscated(this._context)}`;
          str += `else ${virtuals[opcodes[0]].getObfuscated(this._context)}`;
          str += 'end;';
        } else {
          str += `if Enum==${virtuals[opcodes[0]].VIndex} then ${virtuals[opcodes[0]].getObfuscated(this._context)}`;
          str += `else ${virtuals[opcodes[1]].getObfuscated(this._context)}`;
          str += 'end;';
        }
      } else {
        const ordered = [...opcodes].sort((a, b) => a - b);
        const half = Math.floor(ordered.length / 2);
        const sorted0 = ordered.slice(0, half);
        const sorted1 = ordered.slice(half);
        str += `if Enum<=${sorted0[sorted0.length - 1]} then `;
        str += getStr(sorted0);
        str += ' else';
        str += getStr(sorted1);
      }
      return str;
    };

    const allIndices = [];
    for (let i = 0; i < virtuals.length; i++) allIndices.push(i);
    vm += getStr(allIndices);
    vm += settings.preserveLineInfo ? VMStrings.VMP3_LI : VMStrings.VMP3;

    vm = vm.replace(/OP_ENUM/g, '1')
           .replace(/OP_A/g, '2')
           .replace(/OP_B/g, '3')
           .replace(/OP_C/g, '4');

    return vm;
  }
}

module.exports = Generator;
