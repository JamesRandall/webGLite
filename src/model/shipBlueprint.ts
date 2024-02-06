import { loadModel, RenderingModel } from "../resources/models"
import { shipScaleFactor, stationScaleFactor } from "../constants"

export enum ShipModelEnum {
  CobraMk3,
  Adder,
  Anaconda,
  Asp,
  Asteroid,
  Boa,
  Boulder,
  Cargo,
  CobraMk1,
  Constrictor,
  Coriolis,
  Dodo,
  EscapePod,
  FerDeLance,
  Gecko,
  Krait,
  Mamba,
  Missile,
  Moray,
  Python,
  Shuttle,
  Sidewinder,
  Thargoid,
  Thargon,
  Transporter,
  Viper,
  Worm,
}

export interface ShipBlueprint {
  name: string
  model: ShipModelEnum
  renderingModel: RenderingModel
  rollAcceleration: number
  rollDeceleration: number
  maxRollSpeed: number
  maxPitchSpeed: number
  pitchAcceleration: number
  pitchDeceleration: number
  speedAcceleration: number
  maxSpeed: number

  numberOfEnergyBanks: number
  maxEnergy: number
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
  canBeRockHermit: boolean
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
