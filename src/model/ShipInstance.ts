import { ShipBlueprint } from "./shipBlueprint"
import { PositionedObject } from "./localBubble"
import { vec3 } from "gl-matrix"

export enum ShipRoleEnum {
  Missile,
  EscapePod,
  PlanetartTrader, // go between the station and the planet
  Trader, // go between the station and other systems
  Police,
  Pirate,
  BountyHunter,
  Thargoid,
  Station,
  Asteroid,
  Cargo,
}

export interface ShipInstance extends PositionedObject {
  role: ShipRoleEnum
  blueprint: ShipBlueprint
  speed: number
  rendering: {
    shininess: number
  }
  boundingBox: vec3[]
}
