class OpSuperOperator {
  constructor() { this.VIndex = 0; this.subOpcodes = null; }
  isInstruction(instructions) {
    if (!this.subOpcodes || !instructions) return false;
    if (instructions.length !== this.subOpcodes.length) return false;
    for (let i = 0; i < instructions.length; i++) {
      const cd = instructions[i].customData;
      const sub = this.subOpcodes[i];
      if (!cd) return false;
      const { OpMutated } = require('./OpMutated');
      if (sub instanceof OpMutated) {
        if (!sub.mutated || !sub.mutated.isInstruction(instructions[i])) return false;
      } else {
        if (cd.opcode !== sub) return false;
      }
    }
    return true;
  }
  getObfuscated(context) {
    if (!this.subOpcodes) return '';
    let s = '';
    const locals = [];

    for (let index = 0; index < this.subOpcodes.length; index++) {
      let s2 = this.subOpcodes[index].getObfuscated(context);

      const localRegex = /local\s+(.*?)[;=]/g;
      let m;
      while ((m = localRegex.exec(s2)) !== null) {
        const loc = m[1].replace(/\s/g, '');
        if (!locals.includes(loc)) locals.push(loc);
        if (!m[0].includes(';'))
          s2 = s2.replace('local' + m[1], loc);
        else
          s2 = s2.replace('local' + m[1] + ';', '');
      }

      s += s2;

      if (index + 1 < this.subOpcodes.length)
        s += 'InstrPoint = InstrPoint + 1;Inst = Instr[InstrPoint];';
    }

    for (const l of locals)
      s = 'local ' + l + ';' + s;

    return s;
  }
}

module.exports = { OpSuperOperator };
