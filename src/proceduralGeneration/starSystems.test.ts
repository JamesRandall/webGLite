import { ProceduralSeed } from "./seeds"
import { generateGalaxy, generateStarSystem } from "./starSystems"
import { EconomyEnum, GovernmentEnum } from "../model/starSystem"
require("../extensions.ts")

describe("Tests star system generation", () => {
  test("First system is Tibedied", () => {
    const starSystem = generateStarSystem(new ProceduralSeed(0), 0)
    expect(starSystem.name).toBe("Tibedied")
    expect(starSystem.economy).toBe(EconomyEnum.PoorIndustrial)
    expect(starSystem.government).toBe(GovernmentEnum.Feudal)
    expect(starSystem.technologyLevel).toBe(8) // will show as 9 in system view as it adds 1 on display
    expect(starSystem.population).toBe(36)
    expect(starSystem.productivity).toBe(11520)
    expect(starSystem.speciesType).toBe("Human Colonials")
    expect(starSystem.averageRadius).toBe(4610)
  })

  test("Galaxy 0 contains Lave", () => {
    const stars = generateGalaxy(0, 5)
    const starSystem = stars.find((s) => s.name === "Lave")
    expect(starSystem).toBeTruthy()
    expect(starSystem!.economy).toBe(EconomyEnum.RichAgricultural)
    expect(starSystem!.government).toBe(GovernmentEnum.Dictatorship)
    expect(starSystem!.technologyLevel).toBe(4) // will show as 5 in system view as it adds 1 on display
    expect(starSystem!.population).toBe(25)
    expect(starSystem!.productivity).toBe(7000)
    expect(starSystem!.speciesType).toBe("Human Colonials")
    expect(starSystem!.averageRadius).toBe(4116)
    expect(starSystem!.shortRangeDotSize).toBe(3)
  })

  test("Galaxy 0 contains Leesti", () => {
    const stars = generateGalaxy(0, 2)
    const starSystem = stars.find((s) => s.name === "Leesti")
    expect(starSystem).toBeTruthy()
    expect(starSystem!.economy).toBe(EconomyEnum.PoorIndustrial)
    expect(starSystem!.government).toBe(GovernmentEnum.CorporateState)
    expect(starSystem!.technologyLevel).toBe(10) // will show as 11 in system view as it adds 1 on display
    expect(starSystem!.population).toBe(50)
    expect(starSystem!.productivity).toBe(35200)
    expect(starSystem!.speciesType).toBe("Human Colonials")
    expect(starSystem!.averageRadius).toBe(3085)
    //expect(starSystem!.shortRangeDotSize).toBe(3)
  })

  test("Galaxy 0 contains Diso", () => {
    const stars = generateGalaxy(0, 5)
    const starSystem = stars.find((s) => s.name === "Diso")
    expect(starSystem).toBeTruthy()
    expect(starSystem!.economy).toBe(EconomyEnum.AverageAgricultural)
    expect(starSystem!.government).toBe(GovernmentEnum.Democracy)
    expect(starSystem!.technologyLevel).toBe(7) // will show as 8 in system view as it adds 1 on display
    expect(starSystem!.population).toBe(41)
    expect(starSystem!.productivity).toBe(13120)
    expect(starSystem!.speciesType).toBe("Black Furry Felines")
    expect(starSystem!.averageRadius).toBe(6155)
    //expect(starSystem!.shortRangeDotSize).toBe(4)
  })

  test("Galaxy 0 contains Zaonce", () => {
    const stars = generateGalaxy(0, 2)
    const starSystem = stars.find((s) => s.name === "Zaonce")
    expect(starSystem).toBeTruthy()
    expect(starSystem!.economy).toBe(EconomyEnum.AverageIndustrial)
    expect(starSystem!.government).toBe(GovernmentEnum.CorporateState)
    expect(starSystem!.technologyLevel).toBe(11) // will show as 12 in system view as it adds 1 on display
    expect(starSystem!.population).toBe(53)
    expect(starSystem!.productivity).toBe(41976)
    expect(starSystem!.speciesType).toBe("Human Colonials")
    expect(starSystem!.averageRadius).toBe(3873)
    //expect(starSystem!.shortRangeDotSize).toBe(2)
  })

  test("Galaxy 0 contains Riveis", () => {
    const stars = generateGalaxy(0, 5)
    const starSystem = stars.find((s) => s.name === "Riveis")
    expect(starSystem).toBeTruthy()
    expect(starSystem!.economy).toBe(EconomyEnum.AverageAgricultural)
    expect(starSystem!.government).toBe(GovernmentEnum.Democracy)
    expect(starSystem!.technologyLevel).toBe(4) // will show as 5 in system view as it adds 1 on display
    expect(starSystem!.population).toBe(29)
    expect(starSystem!.productivity).toBe(9280)
    expect(starSystem!.speciesType).toBe("Harmless Rodents")
    expect(starSystem!.averageRadius).toBe(6568)
  })
})
