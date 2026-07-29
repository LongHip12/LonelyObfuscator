const Opcode = require('../../ir/Opcode');
const { InstructionType, InstructionConstantMask } = require('../../ir/Enums');

class OpClosure {
  constructor() { this.VIndex = 0; }
  isInstruction(instruction) {
    return instruction.opCode === Opcode.Closure && instruction.chunk.functions[instruction.B] && instruction.chunk.functions[instruction.B].upvalueCount > 0;
  }
  getObfuscated(context) {
    const luaStr = "local NewProto=Proto[Inst[OP_B]];local NewUvals;local Indexes={};NewUvals=Setmetatable({},{__index=function(_,Key)local Val=Indexes[Key];return Val[1][Val[2]];end,__newindex=function(_,Key,Value)local Val=Indexes[Key] Val[1][Val[2]]=Value;end;});for Idx=1,Inst[OP_C] do InstrPoint=InstrPoint+1;local Mvm=Instr[InstrPoint];if Mvm[OP_ENUM]==OP_MOVE then Indexes[Idx-1]={Stk,Mvm[OP_B]};else Indexes[Idx-1]={Upvalues,Mvm[OP_B]};end;Lupvals[#Lupvals+1]=Indexes;end;Stk[Inst[OP_A]]=Wrap(NewProto,NewUvals,Env);";
    const moveOp = context.instructionMapping.get(require('../../ir/Opcode').Move);
    return luaStr.replace('OP_MOVE', moveOp ? moveOp.VIndex.toString() : '-1');
  }
  mutate(instruction) {
    instruction.instructionType = InstructionType.AsBxC;
    instruction.C = instruction.chunk.functions[instruction.B].upvalueCount;
  }
}

module.exports = { OpClosure };
