'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const Deserializer = require('./bytecode/Deserializer');
const ObfuscationContext = require('./obfuscator/ObfuscationContext');
const ObfuscationSettings = require('./obfuscator/ObfuscationSettings');
const Generator = require('./obfuscator/vmgen/Generator');
const ConstantEncryption = require('./obfuscator/encryption/ConstantEncryption');
const { CFContext } = require('./obfuscator/cflow');

const PORT = process.env.PORT || 3000;
const WATERMARK = `-- This file was protected using Lonely Obfuscator v1.0 [https://lonelyhub.wibu.life]\n`;

function findLuac() {
  const isWin = process.platform === 'win32';
  const tryCmd = isWin ? 'where luac' : 'which luac';
  try {
    const r = execSync(tryCmd, { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] });
    return r.trim().split('\n')[0].trim();
  } catch {}
  const candidates = isWin ? [
    'C:\\Program Files (x86)\\Lua\\5.1\\luac.exe',
    'C:\\Program Files\\Lua\\5.1\\luac.exe',
    'C:\\Lua\\luac.exe',
  ] : ['/usr/bin/luac','/usr/local/bin/luac'];
  for (const p of candidates) { try { if (fs.existsSync(p)) return p; } catch {} }
  return null;
}

function findLua() {
  const isWin = process.platform === 'win32';
  const candidates = isWin ? [
    'C:\\Program Files (x86)\\Lua\\5.1\\lua.exe',
    'C:\\Program Files\\Lua\\5.1\\lua.exe',
    'C:\\Lua\\lua.exe',
  ] : ['/usr/bin/lua','/usr/local/bin/lua'];
  for (const p of candidates) { try { if (fs.existsSync(p)) return p; } catch {} }
  return null;
}

function findLuasrcdiet() {
  const p = path.join(__dirname, 'luasrcdiet', 'luasrcdiet.lua');
  return fs.existsSync(p) ? p : null;
}

function collapseNewlines(code) {
  let result = '';
  let i = 0;
  const len = code.length;
  while (i < len) {
    const ch = code[i];
    if (ch === '"' || ch === "'") {
      result += ch; i++;
      while (i < len && code[i] !== ch) {
        if (code[i] === '\\') { result += code[i]; i++; }
        if (i < len) { result += code[i]; i++; }
      }
      if (i < len) { result += code[i]; i++; }
    } else if (ch === '[' && code[i + 1] === '[') {
      const start = i;
      result += code[i]; i++;
      while (i < len && !(code[i] === ']' && code[i + 1] === ']')) {
        result += code[i]; i++;
      }
      result += ']]'; i += 2;
    } else if (ch === '\n') {
      result += ' '; i++;
    } else {
      result += ch; i++;
    }
  }
  return result;
}

function minifyWithLuaSrcDiet(luaCode, tmpDir) {
  const luaPath = findLua();
  const dietPath = findLuasrcdiet();
  if (!luaPath || !dietPath) return luaCode;
  const dietDir = path.dirname(dietPath);
  const tIn = path.join(tmpDir, 'diet_in.lua');
  const tOut = path.join(tmpDir, 'diet_out.lua');
  fs.writeFileSync(tIn, luaCode, 'latin1');
  try {
    execSync(`"${luaPath}" "${dietPath}" "${path.resolve(tIn)}" -o "${path.resolve(tOut)}" --maximum`, {
      cwd: dietDir, stdio: 'pipe', timeout: 30000
    });
    if (fs.existsSync(tOut)) return fs.readFileSync(tOut, 'latin1');
  } catch {}
  return luaCode;
}

function obfuscate(luaSource, opts) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lonely-'));
  try {
    const luacPath = findLuac();
    if (!luacPath) throw new Error('luac not found. Please install Lua 5.1 (luac binary must be in PATH).');

    const tmpIn = path.join(tmpDir, 'input.lua');
    const tmpLuac = path.join(tmpDir, 'compiled.luac');
    fs.writeFileSync(tmpIn, luaSource, 'latin1');
    execSync(`"${luacPath}" -o "${tmpLuac}" "${tmpIn}"`, { stdio: 'pipe', timeout: 30000 });
    const bytecode = fs.readFileSync(tmpLuac);

    const settings = new ObfuscationSettings({
      encryptStrings: opts.encryptStrings || false,
      encryptImportantStrings: opts.encryptImportantStrings || false,
      controlFlow: opts.controlFlow !== false,
      bytecodeCompress: opts.bytecodeCompress !== false,
      mutate: opts.mutate !== false,
      superOperators: opts.superOperators !== false,
      preserveLineInfo: opts.preserveLineInfo || false,
      minify: opts.minify !== false,
      maxMutations: 250,
      maxMegaSuperOperators: 150,
      maxMiniSuperOperators: 150,
    });

    const deserializer = new Deserializer(bytecode);
    const chunk = deserializer.decodeFile();

    if (settings.controlFlow) {
      const cf = new CFContext(chunk);
      cf.doChunks();
    }

    const context = new ObfuscationContext(chunk);
    let vmCode = new Generator(context).generateVM(settings);

    if (settings.minify) {
      vmCode = minifyWithLuaSrcDiet(vmCode, tmpDir);
      vmCode = collapseNewlines(vmCode);
    }

    if (settings.encryptStrings || settings.encryptImportantStrings) {
      const enc = new ConstantEncryption(settings, vmCode);
      vmCode = enc.encryptStrings();
    }

    return WATERMARK + vmCode;
  } finally {
    try {
      fs.readdirSync(tmpDir).forEach(f => fs.unlinkSync(path.join(tmpDir, f)));
      fs.rmdirSync(tmpDir);
    } catch {}
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 5 * 1024 * 1024) reject(new Error('Too large')); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (req.method === 'POST' && req.url === '/obfuscate') {
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body);
      const result = obfuscate(parsed.code || '', parsed.options || {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, result }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message || String(e) }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Lonely Obfuscator running at http://localhost:${PORT}`);
  console.log('Open the above URL in your browser.');
});
