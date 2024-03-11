import { ShipBlueprint } from "./shipBlueprint"
import { ControlState, getEmptyControlState } from "../controls/controlState"
import { StarSystem } from "./starSystem"
import { Resources } from "../resources/resources"
import { vec2, vec3 } from "gl-matrix"
import { Game, SceneEnum } from "./game"
import {
  beamLaserFrequency,
  beamLaserPower,
  militaryLaserFrequency,
  militaryLaserPower,
  miningLaserFrequency,
  miningLaserPower,
  playerEnergyIntervalSeconds,
  playerLaserCooldownIntervalSeconds,
  pulseLaserFrequency,
  pulseLaserPower,
} from "../constants"

export enum MissileStatusEnum {
  Unarmed,
  Armed,
  Locked,
}

export enum LegalStatusEnum {
  Clean,
  Offender,
  SeriousOffender,
  Fugitive,
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

export enum LaserMountEnum {
  Front,
  Rear,
  Left,
  Right,
  None,
}

// map doesn't serialize well so we just use this base
export interface PlayerEquipmentBase {
  largeCargoBay: boolean
  ecmSystem: boolean
  fuelScoops: boolean
  escapePod: boolean
  energyBomb: boolean
  energyUnit: boolean
  dockingComputer: boolean
  galacticHyperdrive: boolean
}

export interface PlayerEquipment extends PlayerEquipmentBase {
  lasers: Map<LaserMountEnum, LaserTypeEnum>
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
  numberOfKills: number
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
    status: MissileStatusEnum
    lockedShipId: number | null
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
  isLaserActive: boolean
  timeToLaserStateChange: number
  laserOffset: vec2
  timeToNextEnergyRecharge: number
  timeToNextLaserCooldown: number
  timeToEnergyBombEnd: number
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
    numberOfKills: 0,
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
      status: MissileStatusEnum.Unarmed,
      lockedShipId: null,
    },
    equipment: {
      largeCargoBay: false,
      ecmSystem: false,
      lasers: new Map([[LaserMountEnum.Front, LaserTypeEnum.Pulse]]),
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
    isLaserFiring: false, // true if the player is firing the laser
    isLaserActive: false, // true if the laser is actively "pulsing" and shown
    timeToLaserStateChange: pulseLaserFrequency,
    laserOffset: vec2.fromValues(0, 0),
    timeToNextEnergyRecharge: playerEnergyIntervalSeconds,
    timeToNextLaserCooldown: playerLaserCooldownIntervalSeconds,
    timeToEnergyBombEnd: 0,
  }
}

export function getLaserMounts(player: Player, laserType: LaserTypeEnum) {
  if (laserType === LaserTypeEnum.None) return []
  return Array.from(player.equipment.lasers)
    .filter(([_, type]) => laserType === type)
    .map(([mount, _]) => mount)
    .sort((a, b) => a - b)
}

export function getLaserForScene(game: Game) {
  const lasers = game.player.equipment.lasers
  switch (game.currentScene) {
    case SceneEnum.Front:
      return lasers.get(LaserMountEnum.Front) ?? LaserTypeEnum.None
    case SceneEnum.Rear:
      return lasers.get(LaserMountEnum.Rear) ?? LaserTypeEnum.None
    case SceneEnum.Left:
      return lasers.get(LaserMountEnum.Left) ?? LaserTypeEnum.None
    case SceneEnum.Right:
      return lasers.get(LaserMountEnum.Right) ?? LaserTypeEnum.None
  }
  return LaserTypeEnum.None
}

export function getLaserSpecs(laserType: LaserTypeEnum) {
  switch (laserType) {
    case LaserTypeEnum.Pulse:
      return [pulseLaserFrequency, pulseLaserPower]
    case LaserTypeEnum.Beam:
      return [beamLaserFrequency, beamLaserPower]
    case LaserTypeEnum.Military:
      return [militaryLaserFrequency, militaryLaserPower]
    case LaserTypeEnum.Mining:
      return [miningLaserFrequency, miningLaserPower]
  }
  return [1, 1]
}

export function getLaserFrequency(laserType: LaserTypeEnum) {
  switch (laserType) {
    case LaserTypeEnum.Pulse:
      return pulseLaserFrequency
    case LaserTypeEnum.Beam:
      return beamLaserFrequency
    case LaserTypeEnum.Military:
      return militaryLaserFrequency
    case LaserTypeEnum.Mining:
      return miningLaserFrequency
  }
  return 1
}

export function getLaserPower(laserType: LaserTypeEnum) {
  switch (laserType) {
    case LaserTypeEnum.Pulse:
      return pulseLaserPower
    case LaserTypeEnum.Beam:
      return beamLaserPower
    case LaserTypeEnum.Military:
      return militaryLaserPower
    case LaserTypeEnum.Mining:
      return miningLaserPower
  }
  return 0
}

export function getLaserMountsText(player: Player, laserType: LaserTypeEnum, short: boolean = true) {
  return getLaserMounts(player, laserType)
    .map((mnt) => {
      switch (mnt) {
        case LaserMountEnum.Front:
          return short ? "Fr" : "Front"
        case LaserMountEnum.Rear:
          return short ? "Re" : "Rear"
        case LaserMountEnum.Left:
          return short ? "Le" : "Left"
        case LaserMountEnum.Right:
          return short ? "Ri" : "Right"
      }
    })
    .join(short ? "/" : ",")
}
