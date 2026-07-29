const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpCall {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Call && instruction.B > 2 && instruction.C > 2;
  }
  getObfuscated(context) {
    return `local A = Inst[OP_A]
local Results = { Stk[A](Unpack(Stk, A + 1, Inst[OP_B])) };
local Edx = 0;
for Idx = A, Inst[OP_C] do 
	Edx = Edx + 1;
	Stk[Idx] = Results[Edx];
end`;
  }
  mutate(instruction) {
    instruction.B += instruction.A - 1;
    instruction.C += instruction.A - 2;
  }
}

class OpCallB2 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Call && instruction.B === 2 && instruction.C > 2;
  }
  getObfuscated(context) {
    return `local A = Inst[OP_A]
local Results = { Stk[A](Stk[A + 1]) };
local Edx = 0;
for Idx = A, Inst[OP_C] do 
	Edx = Edx + 1;
	Stk[Idx] = Results[Edx];
end`;
  }
  mutate(instruction) {
    instruction.C += instruction.A - 2;
  }
}

class OpCallB0 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Call && instruction.B === 0 && instruction.C > 2;
  }
  getObfuscated(context) {
    return `local A = Inst[OP_A]
local Results = { Stk[A](Unpack(Stk, A + 1, Top)) };
local Edx = 0;
for Idx = A, Inst[OP_C] do 
	Edx = Edx + 1;
	Stk[Idx] = Results[Edx];
end`;
  }
  mutate(instruction) {
    instruction.C += instruction.A - 2;
  }
}

class OpCallB1 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Call && instruction.B === 1 && instruction.C > 2;
  }
  getObfuscated(context) {
    return `local A = Inst[OP_A]
local Results = { Stk[A]() };
local Limit = Inst[OP_C];
local Edx = 0;
for Idx = A, Limit do 
	Edx = Edx + 1;
	Stk[Idx] = Results[Edx];
end`;
  }
  mutate(instruction) {
    instruction.C += instruction.A - 2;
  }
}

class OpCallC0 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Call && instruction.B > 2 && instruction.C === 0;
  }
  getObfuscated(context) {
    return `local A = Inst[OP_A]
local Results, Limit = _R(Stk[A](Unpack(Stk, A + 1, Inst[OP_B])))
Top = Limit + A - 1
local Edx = 0;
for Idx = A, Top do 
	Edx = Edx + 1;
	Stk[Idx] = Results[Edx];
end;`;
  }
  mutate(instruction) {
    instruction.B += instruction.A - 1;
  }
}

class OpCallC0B2 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Call && instruction.B === 2 && instruction.C === 0;
  }
  getObfuscated(context) {
    return `local A = Inst[OP_A]
local Results, Limit = _R(Stk[A](Stk[A + 1]))
Top = Limit + A - 1
local Edx = 0;
for Idx = A, Top do 
	Edx = Edx + 1;
	Stk[Idx] = Results[Edx];
end;`;
  }
  mutate(instruction) {
    instruction.B += instruction.A - 1;
  }
}

class OpCallC1 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Call && instruction.B > 2 && instruction.C === 1;
  }
  getObfuscated(context) {
    return `local A = Inst[OP_A]
Stk[A](Unpack(Stk, A + 1, Inst[OP_B]))`;
  }
  mutate(instruction) {
    instruction.B += instruction.A - 1;
  }
}

class OpCallC1B2 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Call && instruction.B === 2 && instruction.C === 1;
  }
  getObfuscated(context) {
    return `local A = Inst[OP_A]
Stk[A](Stk[A + 1])`;
  }
}

class OpCallB0C0 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Call && instruction.B === 0 && instruction.C === 0;
  }
  getObfuscated(context) {
    return `local A = Inst[OP_A]
local Results, Limit = _R(Stk[A](Unpack(Stk, A + 1, Top)))
Top = Limit + A - 1
local Edx = 0;
for Idx = A, Top do 
	Edx = Edx + 1;
	Stk[Idx] = Results[Edx];
end;`;
  }
}

class OpCallB0C1 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Call && instruction.B === 0 && instruction.C === 1;
  }
  getObfuscated(context) {
    return `local A = Inst[OP_A]
Stk[A](Unpack(Stk, A + 1, Top))`;
  }
}

class OpCallB1C0 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Call && instruction.B === 1 && instruction.C === 0;
  }
  getObfuscated(context) {
    return `local A = Inst[OP_A]
local Results, Limit = _R(Stk[A]())
Top = Limit + A - 1
local Edx = 0;
for Idx = A, Top do 
	Edx = Edx + 1;
	Stk[Idx] = Results[Edx];
end;`;
  }
}

class OpCallB1C1 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Call && instruction.B === 1 && instruction.C === 1;
  }
  getObfuscated(context) {
    return "Stk[Inst[OP_A]]();";
  }
}

class OpCallC2 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Call && instruction.B > 2 && instruction.C === 2;
  }
  getObfuscated(context) {
    return `local A = Inst[OP_A]
Stk[A] = Stk[A](Unpack(Stk, A + 1, Inst[OP_B])) `;
  }
  mutate(instruction) {
    instruction.B += instruction.A - 1;
  }
}

class OpCallC2B2 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Call && instruction.B === 2 && instruction.C === 2;
  }
  getObfuscated(context) {
    return `local A = Inst[OP_A]
Stk[A] = Stk[A](Stk[A + 1]) `;
  }
}

class OpCallB0C2 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Call && instruction.B === 0 && instruction.C === 2;
  }
  getObfuscated(context) {
    return `local A = Inst[OP_A]
Stk[A] = Stk[A](Unpack(Stk, A + 1, Top))`;
  }
}

class OpCallB1C2 {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Call && instruction.B === 1 && instruction.C === 2;
  }
  getObfuscated(context) {
    return `local A = Inst[OP_A]
Stk[A] = Stk[A]()`;
  }
}

module.exports = {
  OpCall,
  OpCallB2,
  OpCallB0,
  OpCallB1,
  OpCallC0,
  OpCallC0B2,
  OpCallC1,
  OpCallC1B2,
  OpCallB0C0,
  OpCallB0C1,
  OpCallB1C0,
  OpCallB1C1,
  OpCallC2,
  OpCallC2B2,
  OpCallB0C2,
  OpCallB1C2,
};
