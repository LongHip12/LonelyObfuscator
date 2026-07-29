class Decryptor {
  constructor(name, maxLen) {
    this.name = name;
    this.table = [];
    for (let i = 0; i < maxLen; i++)
      this.table.push(Math.floor(Math.random() * 256));
    this.sLen = 0;
  }

  encrypt(bytes) {
    const encrypted = [];
    const L = this.table.length;
    for (let i = 0; i < bytes.length; i++)
      encrypted.push((bytes[i] ^ this.table[i % L]) & 0xFF);

    const tableStr = this.table.map(t => '\\' + t).join('');
    const encStr = encrypted.map(t => '\\' + t).join('');

    return `((function(b)IB_INLINING_START(true);local function xor(b,c)IB_INLINING_START(true);local d,e=1,0;while b>0 and c>0 do local f,g=b%2,c%2;if f~=g then e=e+d end;b,c,d=(b-f)/2,(c-g)/2,d*2 end;if b<c then b=c end;while b>0 do local f=b%2;if f>0 then e=e+d end;b,d=(b-f)/2,d*2 end;return e end;local c=""local e=string.sub;local h=string.char;local t = {{}} for j=0, 255 do local x=h(j);t[j]=x;t[x]=j;end;local f="${tableStr}" for g=1,#b do local x=(g-1) % ${this.table.length}+1 c=c..t[xor(t[e(b,g,g)],t[e(f, x, x)])];end;return c;end)("${encStr}"))`;
  }
}

class ConstantEncryption {
  constructor(settings, source) {
    this._settings = settings;
    this._src = source;
  }

  static unescapeLuaString(str) {
    const bytes = [];
    let i = 0;
    while (i < str.length) {
      const cur = str.charCodeAt(i++);
      if (cur === 92) {
        const next = str.charCodeAt(i++);
        switch (next) {
          case 97: bytes.push(7); break;
          case 98: bytes.push(8); break;
          case 102: bytes.push(12); break;
          case 110: bytes.push(10); break;
          case 114: bytes.push(13); break;
          case 116: bytes.push(9); break;
          case 118: bytes.push(11); break;
          default:
            if (next < 48 || next > 57) {
              bytes.push(next);
            } else {
              let s = String.fromCharCode(next);
              for (let j = 0; j < 2; j++, i++) {
                if (i === str.length) break;
                const n = str.charCodeAt(i);
                if (n >= 48 && n <= 57) s += String.fromCharCode(n);
                else break;
              }
              bytes.push(parseInt(s, 10) & 0xFF);
            }
        }
      } else {
        bytes.push(cur & 0xFF);
      }
    }
    return bytes;
  }

  _generateGenericDecryptor(matches) {
    let len = 0;
    for (let i = 0; i < matches.length; i++) {
      const l = matches[i].length;
      if (l > len) len = l;
    }
    if (len > this._settings.decryptTableLen) len = this._settings.decryptTableLen;
    return new Decryptor('IRONBREW_STR_DEC_GENERIC', len);
  }

  encryptStrings() {
    const encRegex = /(['"])?(?:(?!\1)((?:[^\\]|\\.)*?)\1|\[(=*)\[(.*?)\]\3\])/gs;

    if (this._settings.encryptStrings) {
      let matches = [];
      let m;
      while ((m = encRegex.exec(this._src)) !== null) matches.push(m);

      const dec = this._generateGenericDecryptor(matches);
      let indDiff = 0;

      for (const match of matches) {
        const before = this._src.substring(0, match.index + indDiff);
        const after = this._src.substring(match.index + indDiff + match[0].length);
        let captured = (match[2] || '') + (match[4] || '');

        if (captured.startsWith('[STR_ENCRYPT]'))
          captured = captured.substring(13);

        const bytes = match[2] !== undefined && match[2] !== ''
          ? ConstantEncryption.unescapeLuaString(captured)
          : Buffer.from(captured, 'latin1');

        const nStr = before + dec.encrypt(bytes);
        this._src = nStr + after;
        indDiff += this._src.length - (before + match[0] + after).length + (before + match[0] + after).length - this._src.length;
        indDiff = this._src.length - (before.length + match[0].length + after.length) + indDiff;
      }
    } else {
      let matches = [];
      let m;
      encRegex.lastIndex = 0;
      while ((m = encRegex.exec(this._src)) !== null) matches.push(m);

      let indDiff = 0;
      let n = 0;

      for (const match of matches) {
        let captured = (match[2] || '') + (match[4] || '');
        if (!captured.startsWith('[STR_ENCRYPT]')) continue;
        captured = captured.substring(13);
        const dec = new Decryptor('IRONBREW_STR_ENCRYPT' + (n++), match[0].length);

        const before = this._src.substring(0, match.index + indDiff);
        const after = this._src.substring(match.index + indDiff + match[0].length);
        const bytes = match[2] !== undefined && match[2] !== ''
          ? ConstantEncryption.unescapeLuaString(captured)
          : Buffer.from(captured, 'latin1');

        const nStr = before + dec.encrypt(bytes);
        this._src = nStr + after;
        indDiff = this._src.length - (before.length + match[0].length + after.length);
      }
    }

    if (this._settings.encryptImportantStrings) {
      let matches = [];
      let m;
      encRegex.lastIndex = 0;
      while ((m = encRegex.exec(this._src)) !== null) matches.push(m);

      let indDiff = 0;
      let n = 0;
      const sTerms = ['http', 'function', 'metatable', 'local'];

      for (const match of matches) {
        let captured = (match[2] || '') + (match[4] || '');
        if (captured.startsWith('[STR_ENCRYPT]')) captured = captured.substring(13);

        let cont = false;
        for (const search of sTerms) {
          if (captured.toLowerCase().includes(search.toLowerCase())) cont = true;
        }
        if (!cont) continue;

        const dec = new Decryptor('IRONBREW_STR_ENCRYPT_IMPORTANT' + (n++), match[0].length);
        const before = this._src.substring(0, match.index + indDiff);
        const after = this._src.substring(match.index + indDiff + match[0].length);
        const bytes = match[2] !== undefined && match[2] !== ''
          ? ConstantEncryption.unescapeLuaString(captured)
          : Buffer.from(captured, 'latin1');

        const nStr = before + dec.encrypt(bytes);
        this._src = nStr + after;
        indDiff = this._src.length - (before.length + match[0].length + after.length);
      }
    }

    return this._src;
  }
}

module.exports = ConstantEncryption;
