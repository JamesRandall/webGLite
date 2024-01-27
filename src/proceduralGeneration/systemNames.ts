import { ProceduralSeed } from "./seeds"

const textTokens = [
  "AL", // Token 128
  "LE", // Token 129
  "XE", // Token 130
  "GE", // Token 131
  "ZA", // Token 132
  "CE", // Token 133
  "BI", // Token 134
  "SO", // Token 135
  "US", // Token 136
  "ES", // Token 137
  "AR", // Token 138
  "MA", // Token 139
  "IN", // Token 140
  "DI", // Token 141
  "RE", // Token 142
  "A", // Token 143
  "ER", // Token 144
  "AT", // Token 145
  "EN", // Token 146
  "BE", // Token 147
  "RA", // Token 148
  "LA", // Token 149
  "VE", // Token 150
  "TI", // Token 151
  "ED", // Token 152
  "OR", // Token 153
  "QU", // Token 154
  "AN", // Token 155
  "TE", // Token 156
  "IS", // Token 157
  "RI", // Token 158
  "ON", // Token 159
]

export function generateSystemName(seeds: ProceduralSeed) {
  const seedCopy = seeds.copy()
  const numberOfPairs = seedCopy.s0_lo.isBitSet(6) ? 4 : 3
  const pairs: string[] = []
  let isCarrySet = false
  for (let counter = 0; counter < numberOfPairs; counter++) {
    const possiblePairIndex = seedCopy.s2_hi.getBitRange(0, 5)
    if (possiblePairIndex > 0) {
      pairs.push(textTokens[possiblePairIndex])
    }
    isCarrySet = seedCopy.twist()
  }
  return { systemName: pairs.join("").capitalize(), carryFlag: isCarrySet }
}
