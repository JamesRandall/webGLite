import { loadModel, Model } from "../resources/models"
import { shipScaleFactor, stationScaleFactor } from "../constants"

export interface ShipBlueprint {
  name: string
  model: Model
  rollAcceleration: number
  rollDeceleration: number
  maxRollSpeed: number
  maxPitchSpeed: number
  pitchAcceleration: number
  pitchDeceleration: number
  speedAcceleration: number
  maxSpeed: number

  numberOfEnergyBanks: number
  maxEnergyBankLevel: number[]
  maxFuel: number
  maxCabinTemperature: number
  maxLaserTemperature: number
  maxAltitude: number
  maxForwardShield: number
  maxAftShield: number
  maxMissiles: number
  maxCargo: number

  // because the ships are different sizes we need a way of making them "about" the same scale on the pregame
  // screen
  pregameScale: number

  canBeTrader: boolean
  canBeBountyHunter: boolean
  canBePirate: boolean
  fixedDirectionOfMovement: boolean
  maxCanistersOnDeath: number
  targetableArea: number
  laserPower: number
  maxAiMissiles: number
  maxAiEnergy: number
  bounty: number
}
