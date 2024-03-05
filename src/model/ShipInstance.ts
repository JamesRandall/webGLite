import { ShipBlueprint } from "./shipBlueprint"
import { PositionedObject } from "./localBubble"
import { vec3 } from "gl-matrix"

export enum ShipRoleEnum {
  Missile,
  EscapePod,
  PlanetaryTrader, // go between the station and the planet
  Trader, // go between the station and other systems
  Police,
  Pirate,
  BountyHunter,
  Thargoid,
  Thargon,
  Station,
  Asteroid,
  Cargo,
  RockHermit, // I need to remind myself what a rock hermit is
}

export enum AttitudeEnum {
  Hostile,
  Friendly,
}

export enum AccelerationModeEnum {
  Accelerating,
  Decelerating,
  None,
}

export enum FlyingTowardsEnum {
  Planet,
  Player,
  AwayFromPlayer,
  None,
}

export interface TacticsState {
  timeUntilNextStateChange: number
  flyingTowards: FlyingTowardsEnum
  canApplyTactics: boolean
}

export interface ShipInstance extends PositionedObject {
  id: number
  role: ShipRoleEnum
  blueprint: ShipBlueprint
  speed: number
  rendering: {
    shininess: number
  }
  aggressionLevel: number
  hasECM: boolean
  hasEscapePod: boolean
  aiEnabled: boolean
  attitude: AttitudeEnum
  energy: number
  missiles: number
  timeLeftFiringLasers: number | null // none null if the ship is firing lasers
  timeUntilCanFireAgain: number | null
  acceleration: AccelerationModeEnum
  pitchAcceleration: AccelerationModeEnum
  rollAcceleration: AccelerationModeEnum
  tacticsState: TacticsState
  isDestroyed: boolean
}
