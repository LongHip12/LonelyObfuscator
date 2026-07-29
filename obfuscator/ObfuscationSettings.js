class ObfuscationSettings {
  constructor(opts) {
    opts = opts || {};
    this.encryptStrings = opts.encryptStrings !== undefined ? opts.encryptStrings : false;
    this.encryptImportantStrings = opts.encryptImportantStrings !== undefined ? opts.encryptImportantStrings : false;
    this.controlFlow = opts.controlFlow !== undefined ? opts.controlFlow : true;
    this.bytecodeCompress = opts.bytecodeCompress !== undefined ? opts.bytecodeCompress : true;
    this.decryptTableLen = opts.decryptTableLen !== undefined ? opts.decryptTableLen : 500;
    this.preserveLineInfo = opts.preserveLineInfo !== undefined ? opts.preserveLineInfo : false;
    this.mutate = opts.mutate !== undefined ? opts.mutate : true;
    this.superOperators = opts.superOperators !== undefined ? opts.superOperators : true;
    this.maxMegaSuperOperators = opts.maxMegaSuperOperators !== undefined ? opts.maxMegaSuperOperators : 120;
    this.maxMiniSuperOperators = opts.maxMiniSuperOperators !== undefined ? opts.maxMiniSuperOperators : 120;
    this.maxMutations = opts.maxMutations !== undefined ? opts.maxMutations : 200;
    this.minify = opts.minify !== undefined ? opts.minify : true;
  }
}

module.exports = ObfuscationSettings;
