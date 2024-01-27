import { generateSystemName } from "./systemNames"
import { ProceduralSeed } from "./seeds"
require("../extensions.ts")

describe("Tests system name generation", () => {
  test("First system is Tibedied", () => {
    const systemNameResult = generateSystemName(new ProceduralSeed(0))
    expect(systemNameResult.systemName).toBe("Tibedied")
  })
})
