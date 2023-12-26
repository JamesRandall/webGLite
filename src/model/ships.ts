import {loadModel, Model} from "../resources/models";
import {vec3} from "gl-matrix";

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

export interface ShipSpecification {
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
}

export interface ShipInstance {
    type: ShipSpecification,
    position: vec3,
    noseOrientation: vec3
    roofOrientation: vec3
    rightOrientation: vec3,
    rendering: {
        shininess: number
    }
}

const ships : ShipSpecification[] = []

export async function loadShipSpecifications(gl:WebGLRenderingContext) {
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
        maxMissiles: 4
    }

    ships.push({ name: "Adder", model: await loadModel(gl, "ships/adder.obj"), ...playerDefaults })
    ships.push({ name: "Anaconda", model: await loadModel(gl, "ships/anaconda.obj"), ...playerDefaults })
    ships.push({ name: "Asp", model: await loadModel(gl, "ships/asp2.obj"), ...playerDefaults })
    ships.push({ name: "Asteroid", model: await loadModel(gl, "ships/asteroid.obj"), ...playerDefaults })
    ships.push({ name: "Boa", model: await loadModel(gl, "ships/boa.obj"), ...playerDefaults })
    ships.push({ name: "Boulder", model: await loadModel(gl, "ships/boulder.obj"), ...playerDefaults })
    ships.push({ name: "Cargo", model: await loadModel(gl, "ships/cargo.obj"), ...playerDefaults })
    ships.push({ name: "Cobra Mk I", model: await loadModel(gl, "ships/cobra1.obj"), ...playerDefaults })
    ships.push({ name: "Cobra Mk III", model: await loadModel(gl, "ships/cobra3.obj", 0.05), ...playerDefaults })
    ships.push({ name: "Constrictor", model: await loadModel(gl, "ships/constric.obj", 0.05), ...playerDefaults })
    ships.push({ name: "Coriolis", model: await loadModel(gl, "ships/coriolis.obj"), ...playerDefaults })
    ships.push({ name: "Dodo", model: await loadModel(gl, "ships/dodo.obj"), ...playerDefaults })
    ships.push({ name: "Escape Pod", model: await loadModel(gl, "ships/escape.obj"), ...playerDefaults })
    ships.push({ name: "Fer de Lance", model: await loadModel(gl, "ships/ferdelan.obj"), ...playerDefaults })
    ships.push({ name: "Gecko", model: await loadModel(gl, "ships/gecko.obj"), ...playerDefaults })
    ships.push({ name: "Krait", model: await loadModel(gl, "ships/krait.obj"), ...playerDefaults })
    ships.push({ name: "Mamba", model: await loadModel(gl, "ships/mamba.obj"), ...playerDefaults })
    ships.push({ name: "Missile", model: await loadModel(gl, "ships/missile.obj"), ...playerDefaults })
    ships.push({ name: "Moray", model: await loadModel(gl, "ships/moray.obj"), ...playerDefaults })
    ships.push({ name: "Python", model: await loadModel(gl, "ships/python.obj"), ...playerDefaults })
    ships.push({ name: "Shuttle", model: await loadModel(gl, "ships/shuttle.obj"), ...playerDefaults })
    ships.push({ name: "Sidewinder", model: await loadModel(gl, "ships/sidewind.obj"), ...playerDefaults })
    ships.push({ name: "Thargoid", model: await loadModel(gl, "ships/thargoid.obj", 0.01), ...playerDefaults })
    ships.push({ name: "Transporter", model: await loadModel(gl, "ships/transporter.obj"), ...playerDefaults })
    ships.push({ name: "Viper", model: await loadModel(gl, "ships/viper.obj", 0.2), ...playerDefaults })
    ships.push({ name: "Worm", model: await loadModel(gl, "ships/worm.obj", 0.2), ...playerDefaults })
}

export function getCobraMk3(position: vec3, noseOrientation:vec3) {
    return {
        type: ships.find(s => s.name === 'Cobra Mk III')!,
        position: position,
        noseOrientation: noseOrientation,
        roofOrientation: [0,1,0],
        rightOrientation: [1,0,0],
        rendering: {
            shininess: 16.0
        }
    } as ShipInstance
}

export function getViper(position: vec3, noseOrientation:vec3) {
    return {
        type: ships.find(s => s.name === 'Viper')!,
        position: position,
        noseOrientation: noseOrientation,
        roofOrientation: [0,1,0],
        rightOrientation: vec3.create(),
        rendering: {
            shininess: 8.0
        }
    } as ShipInstance
}

export function getThargoid(position: vec3, noseOrientation:vec3) {
    return {
        type: ships.find(s => s.name === 'Thargoid')!,
        position: position,
        noseOrientation: noseOrientation,
        roofOrientation: [0,1,0],
        rightOrientation: vec3.create(),
        rendering: {
            shininess: 8.0
        }
    } as ShipInstance
}
