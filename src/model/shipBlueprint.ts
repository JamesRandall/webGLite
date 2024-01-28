import { loadModel, Model } from "../resources/models"
import { shipScaleFactor, stationScaleFactor } from "../constants"

// measured in BBC Elite:
//   1.6 seconds to react max roll speed
//   9.5 seconds for roll to slow to zero
//   3.5 seconds to complete 360 degrees of roll at max roll speed
//   1 second to reach max pitch speed
//   7 seconds for pitch to slow to zero
//   10.6 seconds to complete 360 degrees of pitch at max pitch speed

const maxRollSpeed = (2.0 * Math.PI) / 3.5
const rollAcceleration = maxRollSpeed / 2
const rollDeceleration = maxRollSpeed / 7.0
const maxPitchSpeed = (2.0 * Math.PI) / 10.6
const pitchAcceleration = maxPitchSpeed // / 1.0
const pitchDeceleration = maxPitchSpeed / 7.0
const maxSpeed = 32.0
const speedAcceleration = maxSpeed / 3.0

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
}

export async function loadShipSpecifications(gl: WebGLRenderingContext): Promise<ShipBlueprint[]> {
  const playerDefaults = {
    rollAcceleration: rollAcceleration,
    rollDeceleration: rollDeceleration,
    maxRollSpeed: maxRollSpeed,
    pitchAcceleration: pitchAcceleration,
    pitchDeceleration: pitchDeceleration,
    maxPitchSpeed: maxPitchSpeed,
    speedAcceleration: speedAcceleration,
    maxSpeed: maxSpeed,

    numberOfEnergyBanks: 4,
    maxEnergyBankLevel: [15, 16, 16, 16],
    maxFuel: 70,
    maxCabinTemperature: 255,
    maxLaserTemperature: 255,
    maxAltitude: 255,
    maxForwardShield: 255,
    maxAftShield: 255,
    maxMissiles: 4,
    maxCargo: 20,
    pregameScale: 1,
  }

  const loadingShips = [
    {
      name: "Cobra Mk III",
      model: loadModel(gl, "ships/cobra3.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 2,
    },
    {
      name: "Adder",
      model: loadModel(gl, "ships/adder.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 4,
    },
    {
      name: "Anaconda",
      model: loadModel(gl, "ships/anaconda.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 1.5,
    },
    {
      name: "Asp",
      model: loadModel(gl, "ships/asp2.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
    },
    {
      name: "Asteroid",
      model: loadModel(gl, "ships/asteroid.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 2,
    },
    {
      name: "Boa",
      model: loadModel(gl, "ships/boa.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 2,
    },
    {
      name: "Boulder",
      model: loadModel(gl, "ships/boulder.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 4,
    },
    {
      name: "Cargo",
      model: loadModel(gl, "ships/cargo.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 6,
    },
    {
      name: "Cobra Mk I",
      model: loadModel(gl, "ships/cobra1.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
    },
    {
      name: "Constrictor",
      model: loadModel(gl, "ships/constric.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
    },
    {
      name: "Coriolis",
      model: loadModel(gl, "ships/coriolis.obj", stationScaleFactor),
      ...playerDefaults,
      pregameScale: 0.25,
    },
    {
      name: "Dodo",
      model: loadModel(gl, "ships/dodo.obj", stationScaleFactor),
      ...playerDefaults,
      pregameScale: 0.2,
    },
    {
      name: "Escape Pod",
      model: loadModel(gl, "ships/escape.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 6,
    },
    {
      name: "Fer de Lance",
      model: loadModel(gl, "ships/ferdelan.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
    },
    {
      name: "Gecko",
      model: loadModel(gl, "ships/gecko.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
    },
    {
      name: "Krait",
      model: loadModel(gl, "ships/krait.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 2.5,
    },
    {
      name: "Mamba",
      model: loadModel(gl, "ships/mamba.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
    },
    {
      name: "Missile",
      model: loadModel(gl, "ships/missile.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 7,
    },
    {
      name: "Moray",
      model: loadModel(gl, "ships/moray.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
    },
    {
      name: "Python",
      model: loadModel(gl, "ships/python.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 1.5,
    },
    {
      name: "Shuttle",
      model: loadModel(gl, "ships/shuttle.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 4,
    },
    {
      name: "Sidewinder",
      model: loadModel(gl, "ships/sidewind.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
    },
    {
      name: "Thargoid",
      model: loadModel(gl, "ships/thargoid.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 1.2,
    },
    {
      name: "Transporter",
      model: loadModel(gl, "ships/trans.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
    },
    {
      name: "Viper",
      model: loadModel(gl, "ships/viper.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3.5,
    },
    {
      name: "Worm",
      model: loadModel(gl, "ships/worm.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 4,
    },
  ]
  const loadedShips = await Promise.all(loadingShips.map((ls) => ls.model))
  return loadingShips.map((ls, lsi) => ({
    ...ls,
    model: loadedShips[lsi],
  }))
}
