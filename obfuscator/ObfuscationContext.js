const { shuffle } = require('../utils');

class ObfuscationContext {
  constructor(chunk) {
    this.headChunk = chunk;

    this.chunkSteps = [0, 1, 2, 3, 4];
    shuffle(this.chunkSteps);

    this.instructionSteps1 = [0, 1, 2, 3];
    shuffle(this.instructionSteps1);

    this.instructionSteps2 = [0, 1, 2];
    shuffle(this.instructionSteps2);

    this.constantMapping = [0, 1, 2, 3];
    shuffle(this.constantMapping);

    this.primaryXorKey = Math.floor(Math.random() * 256);
    this.iXorKey1 = Math.floor(Math.random() * 256);
    this.iXorKey2 = Math.floor(Math.random() * 256);

    this.instructionMapping = new Map();
  }
}

ObfuscationContext.ChunkStep = {
  ParameterCount: 0,
  StringTable: 1,
  Instructions: 2,
  Functions: 3,
  LineInfo: 4,
  StepCount: 5
};

module.exports = ObfuscationContext;
