const express = require('express');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const Deserializer = require('./bytecode/Deserializer');
const ObfuscationContext = require('./obfuscator/ObfuscationContext');
const ObfuscationSettings = require('./obfuscator/ObfuscationSettings');
const Generator = require('./obfuscator/vmgen/Generator');
const ConstantEncryption = require('./obfuscator/encryption/ConstantEncryption');
const { CFContext } = require('./obfuscator/cflow');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const WATERMARK = `-- This file was protected using Lonely Obfuscator v1.0 [https://lonelyhub.wibu.life]\n\n`;

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

app.post('/api/obfuscate', (req, res) => {
  const { code, options } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Mã nguồn Lua không hợp lệ hoặc bị trống.' });
  }

  const luacPath = findLuac();
  if (!luacPath) {
    return res.status(500).json({ error: 'Không tìm thấy trình biên dịch luac trên hệ thống server. Vui lòng cài đặt Lua 5.1.' });
  }

  const tmpId = 'tmp_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  const tmpDir = path.join(__dirname, '.ib2tmp_' + tmpId);

  try {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const t0 = path.join(tmpDir, 'input.lua');
    const t1 = path.join(tmpDir, 'output.luac');

    const settings = new ObfuscationSettings();
    if (options) {
      if (options.controlFlow === false) settings.controlFlow = false;
      if (options.mutate === false) settings.mutate = false;
      if (options.superOperators === false) settings.superOperators = false;
      if (options.bytecodeCompress === false) settings.bytecodeCompress = false;
      if (options.encryptStrings === true) settings.encryptStrings = true;
    }

    const encryptedSrc = new ConstantEncryption(settings, code).encryptStrings();
    fs.writeFileSync(t0, encryptedSrc, 'latin1');

    try {
      execSync(`"${luacPath}" -o "${t1}" "${t0}"`, { stdio: 'pipe' });
    } catch (e) {
      const errMsg = e.stderr ? e.stderr.toString() : e.message;
      cleanup(tmpDir);
      return res.status(400).json({ error: 'Lỗi cú pháp Lua khi biên dịch (luac compilation failed):\n' + errMsg });
    }

    if (!fs.existsSync(t1)) {
      cleanup(tmpDir);
      return res.status(500).json({ error: 'Không thể tạo file bytecode.' });
    }

    const bytecode = fs.readFileSync(t1);
    const deserializer = new Deserializer(bytecode);
    const chunk = deserializer.decodeFile();

    if (settings.controlFlow) {
      const cf = new CFContext(chunk);
      cf.doChunks();
    }

    const context = new ObfuscationContext(chunk);
    const vmCode = new Generator(context).generateVM(settings);

    let wrappedVM = "return(function(...)\n" + vmCode + "\nend)(...)";
    let finalOutput = WATERMARK + wrappedVM;

    cleanup(tmpDir);

    res.json({
      success: true,
      result: finalOutput,
      sizeKb: (Buffer.byteLength(finalOutput, 'utf8') / 1024).toFixed(2)
    });

  } catch (err) {
    cleanup(tmpDir);
    console.error('Error during obfuscation:', err);
    res.status(500).json({ error: 'Lỗi trong quá trình mã hóa: ' + err.message });
  }
});

function cleanup(dir) {
  try {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const f of files) fs.unlinkSync(path.join(dir, f));
      fs.rmdirSync(dir);
    }
  } catch {}
}

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`Lonely Obfuscator v1.0 Server running on port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`=================================================`);
});
