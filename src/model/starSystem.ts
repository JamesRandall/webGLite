import {ProceduralSeed} from "../proceduralGeneration/seeds";

export enum EconomyEnum {
    RichIndustrial,
    AverageIndustrial,
    PoorIndustrial,
    MainlyIndustrial,
    MainlyAgricultural,
    RichAgricultural,
    AverageAgricultural,
    PoorAgricultural
}

export const economyText = [
    "Rich Industrial",
    "Average Industrial",
    "Poor Industrial",
    "Mainly Industrial",
    "Mainly Agricultural",
    "Rich Agricultural",
    "Average Agricultural",
    "Poor Agricultural"
]

export enum GovernmentEnum {
    Anarchy,
    Feudal,
    MultiGovernment,
    Dictatorship,
    Communist,
    Confederacy,
    Democracy,
    CorporateState
}

export const governmentText = [
    "Anarchy",
    "Feudal",
    "Multi Government",
    "Dictatorship",
    "Communist",
    "Confederacy",
    "Democracy",
    "Corporate State"
]

export interface Position {
    x: number
    y: number
}

export interface StarSystem {
    seed: ProceduralSeed // this can be useful for finding test data and then regening
    name: string
    economy: EconomyEnum,
    government: GovernmentEnum,
    technologyLevel: number,
    population: number,
    speciesType: string,
    productivity: number,
    averageRadius: number,
    description: string
    galacticPosition: Position
    // TODO: see following link for the below https://www.bbcelite.com/cassette/main/subroutine/solar.html
    sunDistance: number
    planetDistance: number
    sunXYOffset: number
    longRangeDotSize: number
    shortRangeDotSize: number
}