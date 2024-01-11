import {loadModel, Model} from "../resources/models";
import {vec3} from "gl-matrix";
import {shipScaleFactor, stationScaleFactor} from "../constants";

// measured in BBC Elite:
//   1.6 seconds to react max roll speed
//   9.5 seconds for roll to slow to zero
//   3.5 seconds to complete 360 degrees of roll at max roll speed
//   1 second to reach max pitch speed
//   7 seconds for pitch to slow to zero
//   10.6 seconds to complete 360 degrees of pitch at max pitch speed

const maxRollSpeed = (2.0 * Math.PI) / 3.5
const rollAcceleration = maxRollSpeed /1.6
const rollDeceleration = maxRollSpeed/9.5
const maxPitchSpeed = (2.0 * Math.PI) / 10.6
const pitchAcceleration = maxPitchSpeed // / 1.0
const pitchDeceleration = maxPitchSpeed / 7.0
const maxSpeed = 32.0
const speedAcceleration = maxSpeed / 3.0

export interface ShipBlueprint {
    name: string,
    model: Model,
    rollAcceleration: number
    rollDeceleration: number
    maxRollSpeed: number
    maxPitchSpeed : number
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
}

export async function loadShipSpecifications(gl:WebGLRenderingContext) {
    const ships : ShipBlueprint[] = []

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
        maxEnergyBankLevel: [15,16,16,16],
        maxFuel: 70,
        maxCabinTemperature: 255,
        maxLaserTemperature: 255,
        maxAltitude: 255,
        maxForwardShield: 255,
        maxAftShield: 255,
        maxMissiles: 4,
        maxCargo: 20
    }


    // put the Cobra at the start as we always want to kick off the new game screen with that
    ships.push({ name: "Cobra Mk III", model: await loadModel(gl, "ships/cobra3.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Adder", model: await loadModel(gl, "ships/adder.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Anaconda", model: await loadModel(gl, "ships/anaconda.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Asp", model: await loadModel(gl, "ships/asp2.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Asteroid", model: await loadModel(gl, "ships/asteroid.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Boa", model: await loadModel(gl, "ships/boa.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Boulder", model: await loadModel(gl, "ships/boulder.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Cargo", model: await loadModel(gl, "ships/cargo.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Cobra Mk I", model: await loadModel(gl, "ships/cobra1.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Constrictor", model: await loadModel(gl, "ships/constric.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Coriolis", model: await loadModel(gl, "ships/coriolis.obj", stationScaleFactor), ...playerDefaults })
    ships.push({ name: "Dodo", model: await loadModel(gl, "ships/dodo.obj", stationScaleFactor), ...playerDefaults })
    ships.push({ name: "Escape Pod", model: await loadModel(gl, "ships/escape.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Fer de Lance", model: await loadModel(gl, "ships/ferdelan.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Gecko", model: await loadModel(gl, "ships/gecko.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Krait", model: await loadModel(gl, "ships/krait.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Mamba", model: await loadModel(gl, "ships/mamba.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Missile", model: await loadModel(gl, "ships/missile.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Moray", model: await loadModel(gl, "ships/moray.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Python", model: await loadModel(gl, "ships/python.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Shuttle", model: await loadModel(gl, "ships/shuttle.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Sidewinder", model: await loadModel(gl, "ships/sidewind.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Thargoid", model: await loadModel(gl, "ships/thargoid.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Transporter", model: await loadModel(gl, "ships/transporter.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Viper", model: await loadModel(gl, "ships/viper.obj", shipScaleFactor), ...playerDefaults })
    ships.push({ name: "Worm", model: await loadModel(gl, "ships/worm.obj", shipScaleFactor), ...playerDefaults })

    return ships
}

