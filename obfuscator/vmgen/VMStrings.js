'use strict';

const { randInt } = require('../../utils');

function spreadConst(n) {
  const parts = [];
  let rem = n;
  const count = randInt(2, 4);
  for (let i = 0; i < count - 1; i++) {
    const part = randInt(1, Math.max(2, Math.floor(rem / 2)));
    parts.push(part);
    rem -= part;
  }
  parts.push(rem);
  return parts.join('+');
}

function deadCodeBlock() {
  const vars = ['_lx','_qz','_wv','_jk','_nm','_hy','_dp','_rt'];
  const v1 = vars[randInt(0,vars.length)];
  const v2 = vars[randInt(0,vars.length)];
  const n1 = randInt(1,999);
  const n2 = randInt(1,999);
  const blocks = [
    `local ${v1}=${n1};if ${v1}>${n1+1} then local ${v2}=${n2};end;`,
    `do local ${v1}=${n1}*0;if ${v1}~=0 then error("x")end;end;`,
    `do local ${v1}=${n1};local ${v2}=${v1}-${n1};if ${v2}>1 then return end;end;`,
    `do local ${v1}=tostring(${n1});if #${v1}>${n1} then end;end;`,
    `do if (${n1}+${n2})~=(${n1}+${n2}) then return nil end;end;`,
  ];
  return blocks[randInt(0, blocks.length)];
}

function antiDebugBlock() {
  return `local __dbg=debug and debug.getinfo;if __dbg then local __di=__dbg(1);if __di and __di.what~="Lua" then error("") end end;`;
}

function integrityBlock(xorKey) {
  const check = (xorKey ^ 0xAB) & 0xFF;
  return `local __ck=(${spreadConst(xorKey)});if (__ck~=(${spreadConst(xorKey)})) then error("") end;`;
}

function makeVMP1(xorKey) {
  const k = xorKey !== undefined ? xorKey : 'XOR_KEY';
  return `
local BitXOR=bit and bit.bxor or function(a,b)local p,c=1,0;while a>0 and b>0 do local ra,rb=a%2,b%2;if ra~=rb then c=c+p end;a,b,p=(a-ra)/2,(b-rb)/2,p*2 end;if a<b then a=b end;while a>0 do local ra=a%2;if ra>0 then c=c+p end;a,p=(a-ra)/2,p*2 end;return c end;
${antiDebugBlock()}
local function gBit(Bit,Start,End) if End then local Res=(Bit/2^(Start-1))%2^((End-1)-(Start-1)+1);return Res-Res%1;else local Plc=2^(Start-1);return(Bit%(Plc+Plc)>=Plc) and 1 or 0;end;end;
local Pos=1;
local function gBits32() local W,X,Y,Z=Byte(ByteString,Pos,Pos+3);W=BitXOR(W,XOR_KEY);X=BitXOR(X,XOR_KEY);Y=BitXOR(Y,XOR_KEY);Z=BitXOR(Z,XOR_KEY);Pos=Pos+4;return(Z*${spreadConst(16777216)})+(Y*${spreadConst(65536)})+(X*${spreadConst(256)})+W;end;
local function gBits8() local F=BitXOR(Byte(ByteString,Pos,Pos),XOR_KEY);Pos=Pos+1;return F;end;
local function gBits16() local W,X=Byte(ByteString,Pos,Pos+2);W=BitXOR(W,XOR_KEY);X=BitXOR(X,XOR_KEY);Pos=Pos+2;return(X*${spreadConst(256)})+W;end;
local function gFloat() local Left=gBits32();local Right=gBits32();local IsNormal=1;local Mantissa=(gBit(Right,1,20)*(2^32))+Left;local Exponent=gBit(Right,21,31);local Sign=((-1)^gBit(Right,32));if(Exponent==0) then if(Mantissa==0) then return Sign*0;else Exponent=1;IsNormal=0;end;elseif(Exponent==2047) then return(Mantissa==0) and(Sign*(1/0)) or(Sign*(0/0));end;return LDExp(Sign,Exponent-1023)*(IsNormal+(Mantissa/(2^52)));end;
local gSizet=gBits32;
local function gString(Len) local Str;if(not Len) then Len=gSizet();if(Len==0) then return'';end;end;Str=Sub(ByteString,Pos,Pos+Len-1);Pos=Pos+Len;local FStr={};for Idx=1,#Str do FStr[Idx]=Char(BitXOR(Byte(Sub(Str,Idx,Idx)),XOR_KEY)) end;return Concat(FStr);end;
local gInt=gBits32;local function _R(...) return{...},Select('#',...) end;
${deadCodeBlock()}
local function Deserialize()
local Instrs={};local Functions={};local Lines={};local Chunk={Instrs,Functions,nil,Lines};
local ConstCount=gBits32();local Consts={};
for Idx=1,ConstCount do local Type=gBits8();local Cons;if(Type==CONST_BOOL) then Cons=(gBits8()~=0);elseif(Type==CONST_FLOAT) then Cons=gFloat();elseif(Type==CONST_STRING) then Cons=gString();end;Consts[Idx]=Cons;end;
`;
}

const VMP1 = makeVMP1();

const VMP2 = `
local function Wrap(Chunk,Upvalues,Env)
local Instr=Chunk[1];local Proto=Chunk[2];local Params=Chunk[3];
return function(...)
local Instr=Instr;local Proto=Proto;local Params=Params;
local _R=_R;local InstrPoint=1;local Top=-1;
local Vararg={};local Args={...};local PCount=Select('#',...)-1;
local Lupvals={};local Stk={};
for Idx=0,PCount do if(Idx>=Params) then Vararg[Idx-Params]=Args[Idx+1];else Stk[Idx]=Args[Idx+1];end;end;
local Varargsz=PCount-Params+1;local Inst;local Enum;
while true do Inst=Instr[InstrPoint];Enum=Inst[OP_ENUM];`;

const VMP3 = `
InstrPoint=InstrPoint+1;end;end;end;
return(function(...) local __w=Wrap(Deserialize(),{},GetFEnv());return __w(...) end)(...);
`;

const VMP2_LI = `
local PCall=pcall;
local function Wrap(Chunk,Upvalues,Env)
local Instr=Chunk[1];local Proto=Chunk[2];local Params=Chunk[3];
return function(...)
local InstrPoint=1;local Top=-1;local Args={...};local PCount=Select('#',...)-1;
local function Loop()
local Instr=Instr;local Const=Const;local Proto=Proto;local Params=Params;
local _R=_R;local Vararg={};local Lupvals={};local Stk={};
for Idx=0,PCount do if(Idx>=Params) then Vararg[Idx-Params]=Args[Idx+1];else Stk[Idx]=Args[Idx+1];end;end;
local Varargsz=PCount-Params+1;local Inst;local Enum;
while true do Inst=Instr[InstrPoint];Enum=Inst[OP_ENUM];`;

const VMP3_LI = `
InstrPoint=InstrPoint+1;end;end;
A,B=_R(PCall(Loop));if not A[1] then local line=Chunk[7][InstrPoint] or'?';error('ERR['..line..']:'..A[2]);else return Unpack(A,2,B) end;end;end;
return(function(...) local __w=Wrap(Deserialize(),{},GetFEnv());return __w(...) end)(...);
`;

module.exports = { VMP1, VMP2, VMP3, VMP2_LI, VMP3_LI, makeVMP1, deadCodeBlock, spreadConst };
