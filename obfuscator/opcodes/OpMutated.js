class OpMutated {
  constructor() { this.VIndex = 0; this.mutated = null; this.registers = [0, 1, 2]; }
  isInstruction(instruction) { return false; }
  getObfuscated(context) { return this.mutated.getObfuscated(context); }
  mutate(instruction) { if (this.mutated.mutate) this.mutated.mutate(instruction); }
}

module.exports = { OpMutated };
