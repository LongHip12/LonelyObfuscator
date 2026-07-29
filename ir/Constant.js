class Constant {
  constructor(type, data) {
    this.type = type || 0;
    this.data = data !== undefined ? data : null;
    this.backReferences = [];
  }

  clone() {
    const c = new Constant(this.type, this.data);
    c.backReferences = [...this.backReferences];
    return c;
  }
}

module.exports = Constant;
