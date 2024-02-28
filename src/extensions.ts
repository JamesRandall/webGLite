declare global {
  export interface Number {
    isBitSet(bit: number): boolean
    getBitRange(startIndex: number, size: number): number
    flipBitRange(startIndex: number, size: number): number
    setBitRange(startIndex: number, size: number, value: number): number
    clearBitRange(startIndex: number, size: number): number
  }

  export interface String {
    capitalize(): string
  }
}
Number.prototype.isBitSet = function (this: number, bit: number) {
  return (this & (1 << bit)) > 0
}
Number.prototype.getBitRange = function (this: number, startIndex: number, size: number) {
  return (this >> startIndex) & ((1 << size) - 1)
}
Number.prototype.flipBitRange = function (this: number, startIndex: number, size: number) {
  return ((this >> startIndex) & ((1 << size) - 1)) ^ ((1 << size) - 1)
}
Number.prototype.setBitRange = function (this: number, startIndex: number, size: number, value: number) {
  const mask = (1 << size) - 1
  return (this & ~(mask << startIndex)) | ((value & mask) << startIndex)
}
Number.prototype.clearBitRange = function (this: number, startIndex: number, size: number) {
  const mask = (1 << size) - 1
  return this & ~(mask << startIndex)
}
String.prototype.capitalize = function (this: String) {
  const lower = this.toLowerCase()
  return `${this.charAt(0).toUpperCase()}${lower.slice(1)}`
}

export {}
