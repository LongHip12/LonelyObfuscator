const ConstantType = { Nil: 0, Boolean: 1, Number: 2, String: 3 };
const InstructionType = { ABC: 0, ABx: 1, AsBx: 2, AsBxC: 3, Data: 4 };
const InstructionConstantMask = { NK: 0, RA: 1, RB: 2, RC: 4 };

module.exports = { ConstantType, InstructionType, InstructionConstantMask };
