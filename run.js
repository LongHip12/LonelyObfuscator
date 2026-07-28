#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const Deserializer = require('./bytecode/Deserializer');
const VanillaSerializer = require('./bytecode/VanillaSerializer');
const ObfuscationContext = require('./obfuscator/ObfuscationContext');
const ObfuscationSettings = require('./obfuscator/ObfuscationSettings');
const Generator = require('./obfuscator/vmgen/Generator');
const ConstantEncryption = require('./obfuscator/encryption/ConstantEncryption');
const { CFContext } = require('./obfuscator/cflow');

const WATERMARK = `-- This file was protected using Lonely Obfuscator v1.0 [https://lonelyhub.wibu.life]

`;

function printUsage() {
  console.log('Usage: node run.js <input.lua> [output.lua] [options]');
  console.log('');
  console.log('Options:');
  console.log('  --no-control-flow    Disable control flow obfuscation');
  console.log('  --no-mutate          Disable opcode mutation');
  console.log('  --no-super-ops       Disable super operators');
  console.log('  --no-compress        Disable bytecode compression');
  console.log('  --no-minify          Disable LuaSrcDiet minification');
  console.log('  --encrypt-strings    Enable string encryption');
  console.log('  --preserve-lines     Preserve line information');
}

function findLuac() {
  const isWin = process.platform === 'win32';
  const tryCmd = isWin ? 'where luac' : 'which luac';
  try {
    const result = execSync(tryCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return result.trim().split('\n')[0].trim();
  } catch {}

  const candidates = isWin ? [
    'C:\\Program Files (x86)\\Lua\\5.1\\luac.exe',
    'C:\\Program Files\\Lua\\5.1\\luac.exe',
    'C:\\Lua\\luac.exe',
  ] : [
    '/usr/bin/luac',
    '/usr/local/bin/luac',
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function findLua() {
  const isWin = process.platform === 'win32';
  const candidates = isWin ? [
    'C:\\Program Files (x86)\\Lua\\5.1\\lua.exe',
    'C:\\Program Files\\Lua\\5.1\\lua.exe',
    'C:\\Lua\\lua.exe',
  ] : [
    '/usr/bin/lua',
    '/usr/local/bin/lua',
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function findLuasrcdiet() {
  const localPath = path.join(__dirname, 'luasrcdiet', 'luasrcdiet.lua');
  if (fs.existsSync(localPath)) return localPath;
  return null;
}

function minifyWithLuaSrcDiet(luaCode, tmpDir) {
  const luaPath = findLua();
  const dietPath = findLuasrcdiet();
  if (!luaPath || !dietPath) {
    console.log('       LuaSrcDiet not available, skipping minification.');
    return luaCode;
  }
  const dietDir = path.dirname(dietPath);
  const tIn = path.join(tmpDir, 'diet_in.lua');
  const tOut = path.join(tmpDir, 'diet_out.lua');
  fs.writeFileSync(tIn, luaCode, 'latin1');
  try {
    execSync(`"${luaPath}" "${dietPath}" "${path.resolve(tIn)}" -o "${path.resolve(tOut)}" --maximum`, {
      cwd: dietDir,
      stdio: 'pipe',
      timeout: 30000,
    });
    if (fs.existsSync(tOut)) {
      const result = fs.readFileSync(tOut, 'latin1');
      console.log('       Minified: ' + (luaCode.length / 1024).toFixed(1) + ' KB -> ' + (result.length / 1024).toFixed(1) + ' KB');
      return result;
    }
  } catch (e) {
    console.log('       LuaSrcDiet failed, skipping minification.');
  }
  return luaCode;
}

function collapseNewlines(code) {
  let result = '';
  let i = 0;
  const len = code.length;
  while (i < len) {
    const ch = code[i];
    if (ch === '"' || ch === "'") {
      result += ch;
      i++;
      while (i < len && code[i] !== ch) {
        if (code[i] === '\\') { result += code[i]; i++; }
        if (i < len) { result += code[i]; i++; }
      }
      if (i < len) { result += code[i]; i++; }
    } else if (ch === '[' && code[i + 1] === '[') {
      let j = i + 2;
      while (j < len && code[j] !== ']') j++;
      if (code[j] === ']' && code[j + 1] === ']') j += 2;
      result += code.slice(i, j);
      i = j;
    } else if (ch === '-' && code[i + 1] === '-') {
      if (code[i + 2] === '[' && code[i + 3] === '[') {
        let j = i + 4;
        while (j < len - 1 && !(code[j] === ']' && code[j + 1] === ']')) j++;
        j += 2;
        result += code.slice(i, j);
        i = j;
      } else {
        let j = i + 2;
        while (j < len && code[j] !== '\n') j++;
        i = j;
      }
    } else if (ch === '\n' || ch === '\r') {
      i++;
      const prev = result.length > 0 ? result.charCodeAt(result.length - 1) : 0;
      const next = i < len ? code.charCodeAt(i) : 0;
      const isAlphaNum = (c) => (c >= 97 && c <= 122) || (c >= 65 && c <= 90) || (c >= 48 && c <= 57) || c === 95;
      if (prev && next && isAlphaNum(prev) && isAlphaNum(next)) {
        result += ' ';
      }
    } else {
      result += ch;
      i++;
    }
  }
  return result;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  let inputFile = null;
  let outputFile = null;
  const settings = new ObfuscationSettings();

  for (const arg of args) {
    if (arg === '--no-control-flow') settings.controlFlow = false;
    else if (arg === '--no-mutate') settings.mutate = false;
    else if (arg === '--no-super-ops') settings.superOperators = false;
    else if (arg === '--no-compress') settings.bytecodeCompress = false;
    else if (arg === '--no-minify') settings.minify = false;
    else if (arg === '--encrypt-strings') settings.encryptStrings = true;
    else if (arg === '--preserve-lines') settings.preserveLineInfo = true;
    else if (!inputFile) inputFile = arg;
    else if (!outputFile) outputFile = arg;
  }

  if (!inputFile) {
    console.error('Error: No input file specified.');
    printUsage();
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.error('Error: Input file not found:', inputFile);
    process.exit(1);
  }

  outputFile = outputFile || inputFile.replace(/\.lua$/i, '_obfuscated.lua');

  const luacPath = findLuac();
  if (!luacPath) {
    console.error('Error: luac not found in PATH. Please install Lua.');
    process.exit(1);
  }

  console.log('IronBrew 2 JS Obfuscator');
  console.log('========================');

  try {
    console.log('[1/5] Compiling Lua to bytecode...');
    const tmpDir = path.join(path.dirname(outputFile), '.ib2tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const t0 = path.join(tmpDir, 't0.lua');
    const t1 = path.join(tmpDir, 't1.luac');

    console.log('[2/5] Applying string encryption...');
    const src = fs.readFileSync(inputFile, 'latin1');
    const encryptedSrc = new ConstantEncryption(settings, src).encryptStrings();
    fs.writeFileSync(t0, encryptedSrc, 'latin1');

    console.log('[3/5] Compiling encrypted source...');
    try {
      execSync(`"${luacPath}" -o "${t1}" "${t0}"`, { stdio: 'pipe' });
    } catch (e) {
      console.error('Error: luac compilation failed.');
      console.error(e.stderr ? e.stderr.toString() : e.message);
      cleanup(tmpDir);
      process.exit(1);
    }

    if (!fs.existsSync(t1)) {
      console.error('Error: Bytecode file not created.');
      cleanup(tmpDir);
      process.exit(1);
    }

    const bytecode = fs.readFileSync(t1);

    console.log('[4/5] Deserializing bytecode...');
    const deserializer = new Deserializer(bytecode);
    const chunk = deserializer.decodeFile();

    if (settings.controlFlow) {
      console.log('       Applying control flow obfuscation...');
      const cf = new CFContext(chunk);
      cf.doChunks();
    }

    console.log('[5/5] Generating obfuscated VM...');
    const context = new ObfuscationContext(chunk);
    const vmCode = new Generator(context).generateVM(settings);

    let wrappedVM = "return(function(...)\n" + finalOutput + "\nend)(...)";
    finalOutput = WATERMARK + wrappedVM;
    fs.writeFileSync(outputFile, finalOutput, 'latin1');

    cleanup(tmpDir);

    console.log('');
    console.log('Obfuscation complete!');
    console.log('Output: ' + outputFile);
    console.log('Size: ' + (fs.statSync(outputFile).size / 1024).toFixed(1) + ' KB');

  } catch (e) {
    console.error('ERROR during obfuscation:');
    console.error(e);
    process.exit(1);
  }
}

function cleanup(dir) {
  try {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const f of files) fs.unlinkSync(path.join(dir, f));
      fs.rmdirSync(dir);
    }
  } catch {}
}

main();
