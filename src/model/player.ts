import { ShipBlueprint } from "./shipBlueprint"
import { ControlState, getEmptyControlState } from "../controls/controlState"
import { Position, StarSystem } from "./starSystem"
import { Resources } from "../resources/resources"
import { vec2, vec3 } from "gl-matrix"
import { Game } from "./game"

enum MissileTargettingStatusEnum {
  Normal,
  Targetting,
  LockedOn,
}

export enum LegalStatusEnum {
  Clean,
}

export enum CombatRatingEnum {
  Harmless,
  MostlyHarmless,
  Poor,
  Average,
  AboveAverage,
  Competent,
  Dangerous,
  Deadly,
  Elite,
}

export enum LaserTypeEnum {
  None,
  Pulse,
  Beam,
  Mining,
  Military,
}

export interface PlayerEquipment {
  largeCargoBay: boolean
  ecmSystem: boolean
  frontLaser: LaserTypeEnum
  aftLaser: LaserTypeEnum
  portLaser: LaserTypeEnum
  starboardLaser: LaserTypeEnum
  fuelScoops: boolean
  escapePod: boolean
  energyBomb: boolean
  energyUnit: boolean
  dockingComputer: boolean
  galacticHyperdrive: boolean
}

export interface Player {
  previousControlState: ControlState
  controlState: ControlState
  blueprint: ShipBlueprint
  pitch: number
  roll: number
  speed: number
  cash: number
  name: string
  legalStatus: LegalStatusEnum
  combatRating: CombatRatingEnum
  isDocked: boolean
  dockingComputerFlightExecuter: ((game: Game, timeDelta: number) => void) | null
  fuel: number
  energyBankLevel: number
  cabinTemperature: number
  laserTemperature: number
  altitude: number
  forwardShield: number
  aftShield: number
  missiles: {
    currentNumber: number
    status: MissileTargettingStatusEnum
  }
  equipment: PlayerEquipment
  galaxyIndex: number
  selectedSystem: StarSystem // the system the player has selected in the star charts
  scannerCursor: vec2
  cargoHoldContents: number[]
  isInSafeZone: boolean
  disableDamping: boolean
  isJumping: boolean
  lookAt: vec3
  isLaserFiring: boolean
  timeToLaserStateChange: number | null
  laserOffset: vec2
}

export function getStartingPlayer(resources: Resources, currentSystem: StarSystem): Player {
  const cobra = resources.ships.getCobraMk3([0, 0, 0], [0, 1, 0]).blueprint
  return {
    previousControlState: getEmptyControlState(),
    controlState: getEmptyControlState(),
    blueprint: cobra,
    pitch: 0.0, // radians per second
    roll: 0.0, // radians per second
    speed: 0.0,
    cash: 100.0,
    name: "Jameson",
    legalStatus: LegalStatusEnum.Clean,
    combatRating: CombatRatingEnum.Harmless,
    isDocked: true,
    dockingComputerFlightExecuter: null,
    fuel: cobra.maxFuel, // 70 is a full tank, goes 7 lightyears
    energyBankLevel: cobra.maxEnergy,
    cabinTemperature: 10,
    laserTemperature: 0,
    altitude: cobra.maxAltitude,
    forwardShield: cobra.maxForwardShield,
    aftShield: cobra.maxAftShield,
    missiles: {
      currentNumber: cobra.maxMissiles - 1,
      status: MissileTargettingStatusEnum.Normal,
    },
    equipment: {
      largeCargoBay: false,
      ecmSystem: false,
      frontLaser: LaserTypeEnum.Pulse,
      aftLaser: LaserTypeEnum.None,
      portLaser: LaserTypeEnum.None,
      starboardLaser: LaserTypeEnum.None,
      fuelScoops: false,
      escapePod: false,
      energyBomb: false,
      energyUnit: false,
      dockingComputer: true,
      galacticHyperdrive: false,
    },
    cargoHoldContents: [],
    galaxyIndex: 0,
    selectedSystem: currentSystem,
    scannerCursor: vec2.copy(vec2.create(), currentSystem.galacticPosition),
    isInSafeZone: false,
    disableDamping: false,
    isJumping: false,
    lookAt: vec3.fromValues(0, 0, 1),
    isLaserFiring: false,
    timeToLaserStateChange: null,
    laserOffset: vec2.fromValues(0, 0),
  }
}
