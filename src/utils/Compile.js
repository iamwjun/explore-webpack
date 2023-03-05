class Compile {
  constructor(a, b, c) {
    this.a = a;
    this.b = b;
    this.c =c;
  }

  getString () {
    return `${this.a} + ${this.b} + ${this.c}`
  }
}

module.exports = Compile;