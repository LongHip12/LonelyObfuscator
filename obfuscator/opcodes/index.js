"use strict";

const { OpAdd, OpAddB, OpAddC, OpAddBC } = require("./OpAdd");
const { OpSub, OpSubB, OpSubC, OpSubBC } = require("./OpSub");
const { OpMul, OpMulB, OpMulC, OpMulBC } = require("./OpMul");
const { OpDiv, OpDivB, OpDivC, OpDivBC } = require("./OpDiv");
const { OpMod, OpModB, OpModC, OpModBC } = require("./OpMod");
const { OpPow, OpPowB, OpPowC, OpPowBC } = require("./OpPow");
const { OpMove } = require("./OpMove");
const { OpLoadK } = require("./OpLoadK");
const { OpLoadBool, OpLoadBoolC } = require("./OpLoadBool");
const { OpLoadNil } = require("./OpLoadNil");
const { OpGetGlobal } = require("./OpGetGlobal");
const { OpSetGlobal } = require("./OpSetGlobal");
const { OpGetTable, OpGetTableConst } = require("./OpGetTable");
const { OpSetTable, OpSetTableConst } = require("./OpSetTable");
const { OpGetUpval } = require("./OpGetUpval");
const { OpSetUpval } = require("./OpSetUpval");
const { OpConcat } = require("./OpConcat");
const { OpLen } = require("./OpLen");
const { OpNot } = require("./OpNot");
const { OpUnm } = require("./OpUnm");
const { OpNewTable } = require("./OpNewTable");
const { OpClose } = require("./OpClose");
const { OpJmp } = require("./OpJmp");
const { OpSelf, OpSelfC } = require("./OpSelf");
const { OpNewStk } = require("./OpNewStk");
const { OpPushStk } = require("./OpPushStk");
const { OpSetFEnv } = require("./OpSetFEnv");
const { OpEq, OpEqB, OpEqC, OpEqBC } = require("./OpEq");
const { OpNe, OpNeB, OpNeC, OpNeBC } = require("./OpNe");
const { OpLt, OpLtB, OpLtC, OpLtBC } = require("./OpLt");
const { OpLe, OpLeB, OpLeC, OpLeBC } = require("./OpLe");
const { OpGt, OpGtB, OpGtC, OpGtBC } = require("./OpGt");
const { OpGe, OpGeB, OpGeC, OpGeBC } = require("./OpGe");
const { OpTest, OpTestC } = require("./OpTest");
const { OpTestSet, OpTestSetC } = require("./OpTestSet");
const { OpForLoop } = require("./OpForLoop");
const { OpForPrep } = require("./OpForPrep");
const { OpTForLoop } = require("./OpTForLoop");
const { OpReturn, OpReturnB2, OpReturnB3, OpReturnB0, OpReturnB1 } = require("./OpReturn");
const { OpTailCall, OpTailCallC, OpTailCallB2, OpTailCallB0C0, OpTailCallB0C2 } = require("./OpTailCall");
const { OpCall, OpCallB2, OpCallB0, OpCallB1, OpCallC0, OpCallC0B2, OpCallC1, OpCallC1B2, OpCallB0C0, OpCallB0C1, OpCallB1C0, OpCallB1C1, OpCallC2, OpCallC2B2, OpCallB0C2, OpCallB1C2 } = require("./OpCall");
const { OpClosure } = require("./OpClosure");
const { OpClosureNU } = require("./OpClosureNU");
const { OpSetList, OpSetListB0 } = require("./OpSetList");
const { OpVarArg, OpVarArgB0 } = require("./OpVarArg");
const { OpSuperOperator } = require("./OpSuperOperator");
const { OpMutated } = require("./OpMutated");

module.exports = [
  OpAdd, OpAddB, OpAddC, OpAddBC,
  OpSub, OpSubB, OpSubC, OpSubBC,
  OpMul, OpMulB, OpMulC, OpMulBC,
  OpDiv, OpDivB, OpDivC, OpDivBC,
  OpMod, OpModB, OpModC, OpModBC,
  OpPow, OpPowB, OpPowC, OpPowBC,
  OpMove, OpLoadK, OpLoadBool, OpLoadBoolC, OpLoadNil,
  OpGetGlobal, OpSetGlobal,
  OpGetTable, OpGetTableConst, OpSetTable, OpSetTableConst,
  OpGetUpval, OpSetUpval,
  OpConcat, OpLen, OpNot, OpUnm,   OpNewTable, OpClose,
  OpJmp, OpSelf, OpSelfC,
  OpNewStk, OpPushStk, OpSetFEnv,
  OpEq, OpEqB, OpEqC, OpEqBC,
  OpNe, OpNeB, OpNeC, OpNeBC,
  OpLt, OpLtB, OpLtC, OpLtBC,
  OpLe, OpLeB, OpLeC, OpLeBC,
  OpGt, OpGtB, OpGtC, OpGtBC,
  OpGe, OpGeB, OpGeC, OpGeBC,
  OpTest, OpTestC, OpTestSet, OpTestSetC,
  OpForLoop, OpForPrep, OpTForLoop,
  OpReturn, OpReturnB2, OpReturnB3, OpReturnB0, OpReturnB1,
  OpTailCall, OpTailCallC, OpTailCallB2, OpTailCallB0C0, OpTailCallB0C2,
  OpCall, OpCallB2, OpCallB0, OpCallB1, OpCallC0, OpCallC0B2,
  OpCallC1, OpCallC1B2, OpCallB0C0, OpCallB0C1, OpCallB1C0, OpCallB1C1,
  OpCallC2, OpCallC2B2, OpCallB0C2, OpCallB1C2,
  OpClosure, OpClosureNU,
  OpSetList, OpSetListB0, OpVarArg, OpVarArgB0,
  OpSuperOperator, OpMutated,
];
