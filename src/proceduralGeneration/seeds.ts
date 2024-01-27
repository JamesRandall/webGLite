const littleEndian = true

export class ProceduralSeed {
  private dataView: DataView

  constructor(from: number | DataView) {
    this.dataView = new DataView(new ArrayBuffer(6))
    if (typeof from === "number") {
      // creating for a galaxy
      this.dataView.setUint16(0, 0x5a4a, littleEndian)
      this.dataView.setUint16(2, 0x0248, littleEndian)
      this.dataView.setUint16(4, 0xb753, littleEndian)
    } else {
      const src = from as DataView
      this.dataView.setUint16(0, src.getUint16(0, littleEndian), littleEndian)
      this.dataView.setUint16(2, src.getUint16(2, littleEndian), littleEndian)
      this.dataView.setUint16(4, src.getUint16(4, littleEndian), littleEndian)
    }
  }

  copy() {
    return new ProceduralSeed(this.dataView)
  }

  // we return if the carry flag was set by the last addition as this is sometimes used in the procedural
  // generation
  twist() {
    // anding with 0xFFFF emulates adding two 16-bit numbers together
    const tmp = (this.s0 + this.s1) & 0xffff
    this.s0 = this.s1
    this.s1 = this.s2
    const newS2 = tmp + this.s1
    this.s2 = newS2 & 0xffff
    return newS2 > this.s2
  }

  get s0() {
    return this.dataView.getUint16(0, littleEndian)
  }
  set s0(value: number) {
    this.dataView.setUint16(0, value, littleEndian)
  }
  get s0_lo() {
    return this.dataView.getUint8(0)
  }
  get s0_hi() {
    return this.dataView.getUint8(1)
  }
  get s1() {
    return this.dataView.getUint16(2, littleEndian)
  }
  set s1(value: number) {
    this.dataView.setUint16(2, value, littleEndian)
  }
  get s1_lo() {
    return this.dataView.getUint8(2)
  }
  get s1_hi() {
    return this.dataView.getUint8(3)
  }
  get s2() {
    return this.dataView.getUint16(4, littleEndian)
  }
  set s2(value: number) {
    this.dataView.setUint16(4, value, littleEndian)
  }
  get s2_lo() {
    return this.dataView.getUint8(4)
  }
  get s2_hi() {
    return this.dataView.getUint8(5)
  }
}
