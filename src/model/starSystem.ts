import { ProceduralSeed } from "../proceduralGeneration/seeds"
import { vec2 } from "gl-matrix"

// I realise the numbers I have assigned are the normal order - but the values are important and so
// I'd rather be explicit.
export enum EconomyEnum {
  RichIndustrial = 0,
  AverageIndustrial = 1,
  PoorIndustrial = 2,
  MainlyIndustrial = 3,
  MainlyAgricultural = 4,
  RichAgricultural = 5,
  AverageAgricultural = 6,
  PoorAgricultural = 7,
}

export const economyText = [
  "Rich Industrial",
  "Average Industrial",
  "Poor Industrial",
  "Mainly Industrial",
  "Mainly Agricultural",
  "Rich Agricultural",
  "Average Agricultural",
  "Poor Agricultural",
]

export enum GovernmentEnum {
  Anarchy,
  Feudal,
  MultiGovernment,
  Dictatorship,
  Communist,
  Confederacy,
  Democracy,
  CorporateState,
}

export const governmentText = [
  "Anarchy",
  "Feudal",
  "Multi Government",
  "Dictatorship",
  "Communist",
  "Confederacy",
  "Democracy",
  "Corporate State",
]

export interface Position {
  x: number
  y: number
}

export interface StarSystem {
  seed: ProceduralSeed // this can be useful for finding test data and then regening
  name: string
  economy: EconomyEnum
  government: GovernmentEnum
  technologyLevel: number
  population: number
  speciesType: string
  productivity: number
  averageRadius: number
  description: string
  galacticPosition: vec2
  // TODO: see following link for the below https://www.bbcelite.com/cassette/main/subroutine/solar.html
  sunDistance: number
  planetDistance: number
  sunXYOffset: number
  longRangeDotSize: number
  shortRangeDotSize: number
  surfaceTextureIndex: number
}
