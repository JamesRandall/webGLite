import {ProceduralSeed} from "./seeds";
import {EconomyEnum, GovernmentEnum, StarSystem} from "../model/starSystem";
import {generateSystemName} from "./systemNames";
import {getSpecies} from "./species";
import {galaxySize} from "../constants";
import {vec2} from "gl-matrix";

export function generateStarSystem(seed: ProceduralSeed) : StarSystem {
    const economy = seed.s0_hi.getBitRange(0,3)
    const flippedEconomy = seed.s0_hi.flipBitRange(0, 3)
    const government = seed.s1_lo.getBitRange(3,3)
    const techLevel = flippedEconomy + (seed.s1_hi & 3) + Math.ceil(government/2)
    const population = (techLevel * 4) + economy + government + 1
    const systemNameResult = generateSystemName(seed)

    return {
        seed: seed.copy(),
        name: systemNameResult.systemName,
        economy: economy as EconomyEnum,
        government: government as GovernmentEnum,
        // when displayed this has to have 1 added to it (range 0 to 14 is displayed as 0 to 15)
        technologyLevel: techLevel,
        population: population,
        speciesType: getSpecies(seed),
        productivity: (flippedEconomy + 3) * (government + 4) * population * 8,
        averageRadius: ((seed.s2_hi & 0xF) + 11) * 256 + seed.s1_hi,
        description: '',
        // the positions are 8-bits but a galaxy looks to be sized 102.4x51.2 so we scale here
        // https://www.bbcelite.com/master/main/workspace/zp.html#qq8
        // galacticPosition: { x: seed.s1_hi, y: seed.s0_hi },
        galacticPosition: vec2.fromValues(seed.s1_hi * (galaxySize.width/256), seed.s0_hi * (galaxySize.height/256)),
        planetDistance: seed.s0_hi & 7,
        sunDistance: seed.s1_hi & 7,
        sunXYOffset: seed.s2_hi & 3,
        longRangeDotSize: seed.s2_lo.getBitRange(4,3) & 5,
        // the short range dot size is based on the bit in s2_lo and the carry flag resulting from the
        // print name operation on the short range scanner - to make this accurate I will need to carefully
        // replicate that routine - or at least figure out what is responsible for the final carry flag
        // on first pass I thought it was the twist, but its not. Need to go back through.
        shortRangeDotSize: (seed.s2_lo & 1) + 2 + (systemNameResult.carryFlag ? 1 : 0)
    }
}

export function generateGalaxy(galaxyNumber: number) {
    const seed = new ProceduralSeed(galaxyNumber)
    const systems : StarSystem[] = []
    // each galaxy contains 256 stars
    for (var counter=0; counter < 256; counter++) {
        systems.push(generateStarSystem(seed))
        // we twist four times to get to the next system
        seed.twist()
        seed.twist()
        seed.twist()
        seed.twist()
    }
    return systems
}