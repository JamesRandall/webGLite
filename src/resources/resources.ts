import { ShipBlueprint, ShipModelEnum } from "../model/shipBlueprint"
import { vec3 } from "gl-matrix"
import {
  AccelerationModeEnum,
  AttitudeEnum,
  FlyingTowardsEnum,
  ShipInstance,
  ShipRoleEnum,
} from "../model/ShipInstance"
import { loadTexture } from "./texture"
import { loadExplosionFromModel, loadModel } from "./models"
import { shipMovementSpeeds, shipScaleFactor, stationScaleFactor } from "../constants"
import { calculateOrientationsFromNose } from "../model/geometry"
import { createSoundEffects, SoundEffects } from "../audio"

export interface ShaderSource {
  frag: string
  vert: string
}

export interface Resources {
  ships: {
    numberOfShips: number
    traderIndexes: number[]
    bountyHunterIndexes: number[]
    pirateIndexes: number[]
    rockHermitIndexes: number[]
    getRandomShip: () => ShipBlueprint
    getInstanceOfModel: (model: ShipModelEnum, position: vec3, noseOrientation: vec3) => ShipInstance
    getIndexedShip: (index: number, position: vec3, noseOrientation: vec3) => ShipInstance
    getCobraMk3: (position: vec3, noseOrientation: vec3) => ShipInstance
    getThargoid: (position: vec3, noseOrientation: vec3) => ShipInstance
    getCoriolis: (position: vec3, noseOrientation: vec3) => ShipInstance
    getAsteroid: (position: vec3, noseOrientation: vec3) => ShipInstance
    getBoulder: (position: vec3, noseOrientation: vec3) => ShipInstance
    getCargo: (position: vec3, noseOrientation: vec3) => ShipInstance
    getTransporter: (position: vec3, noseOrientation: vec3) => ShipInstance
    getShuttle: (position: vec3, noseOrientation: vec3) => ShipInstance
  }
  textures: {
    planets: WebGLTexture[]
    noise: WebGLTexture
    font: WebGLTexture
    instructionsFont: WebGLTexture
    starmask: WebGLTexture
    scanner: WebGLTexture
  }
  shaderSource: {
    stardust: ShaderSource
    ship: ShaderSource
    planet: ShaderSource
    sun: ShaderSource
    uColor: ShaderSource
    text: ShaderSource
    simpleTexture: ShaderSource
    crt: ShaderSource
    amberCrt: ShaderSource
    greenCrt: ShaderSource
    vcr: ShaderSource
    motionBlur: ShaderSource
  }
  soundEffects: SoundEffects
}

async function loadShaderSource(name: string) {
  const fragResponse = await fetch(`shaders/${name}.frag`)
  const vertResponse = await fetch(`shaders/${name}.vert`)
  return {
    frag: await fragResponse.text(),
    vert: await vertResponse.text(),
  }
}

export async function loadResources(
  gl: WebGL2RenderingContext,
  instructionsGl: WebGL2RenderingContext,
): Promise<Resources> {
  const ships = await loadShipSpecifications(gl)
  const shaderNames = [
    "stardust",
    "ship",
    "planet",
    "sun",
    "uColor",
    "text",
    "simpleTexture",
    "crt",
    "ambercrt",
    "greencrt",
    "vcr",
    "motionblur",
  ]
  const loadedShaders = await Promise.all(shaderNames.map((sn) => loadShaderSource(sn)))
  const namedShaders = new Map<string, ShaderSource>(shaderNames.map((sn, index) => [sn, loadedShaders[index]]))
  const planets = await Promise.all(
    [
      "./mars.png",
      "./neptune.png",
      "./venusSurface.png",
      "./venusAtmosphere.png",
      "./saturn.png",
      "./uranus.png",
      "./mercury.png",
      "./moon.png",
      "./ceres.png",
      "./eris.png",
      "./haumea.png",
      "./makemake.png",
    ].map((t) => loadTexture(gl, t)),
  )
  const textureNames = ["noise", "font", "starmask", "scanner"]
  const loadedTextures = await Promise.all(textureNames.map((tn) => loadTexture(gl, `./${tn}.png`)))
  const textures = new Map<string, WebGLTexture>(loadedTextures.map((t, i) => [textureNames[i], t]))
  const instructionFont = await loadTexture(instructionsGl, "font.png")
  const traderIndexes = ships
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.canBeTrader)
    .map(({ i }) => i)
  const bountyHunterIndexes = ships
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.canBeBountyHunter)
    .map(({ i }) => i)
  const pirateIndexes = ships
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.canBePirate)
    .map(({ i }) => i)
  const rockHermitIndexes = ships
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.canBeRockHermit)
    .map(({ i }) => i)
  return {
    ships: {
      numberOfShips: ships.length,
      traderIndexes,
      bountyHunterIndexes,
      pirateIndexes,
      rockHermitIndexes,
      getInstanceOfModel: (model: ShipModelEnum, position: vec3, noseOrientation: vec3) =>
        toInstance(ships.filter((s) => s.model === model)[0], position, noseOrientation),
      getRandomShip: () => getRandomShip(ships),
      getIndexedShip: (index: number, position: vec3, noseOrientation: vec3) =>
        toInstance(ships[index], position, noseOrientation),
      getCobraMk3: (position: vec3, noseOrientation: vec3) =>
        getNamedShip(ships, "Cobra Mk III", position, noseOrientation),
      getThargoid: (position: vec3, noseOrientation: vec3) =>
        getNamedShip(ships, "Thargoid", position, noseOrientation, ShipRoleEnum.Thargoid),
      getCoriolis: (position: vec3, noseOrientation: vec3) =>
        getNamedShip(ships, "Coriolis", position, noseOrientation, ShipRoleEnum.Station),
      getAsteroid: (position: vec3, noseOrientation: vec3) =>
        getNamedShip(ships, "Asteroid", position, noseOrientation, ShipRoleEnum.Asteroid),
      getBoulder: (position: vec3, noseOrientation: vec3) =>
        getNamedShip(ships, "Boulder", position, noseOrientation, ShipRoleEnum.Asteroid),
      getCargo: (position: vec3, noseOrientation: vec3) =>
        getNamedShip(ships, "Thargoid", position, noseOrientation, ShipRoleEnum.Cargo),
      getTransporter: (position: vec3, noseOrientation: vec3) =>
        getNamedShip(ships, "Transporter", position, noseOrientation, ShipRoleEnum.Cargo),
      getShuttle: (position: vec3, noseOrientation: vec3) =>
        getNamedShip(ships, "Shuttle", position, noseOrientation, ShipRoleEnum.Cargo),
    },
    textures: {
      planets: planets,
      noise: textures.get("noise")!,
      font: textures.get("font")!,
      starmask: textures.get("starmask")!,
      scanner: textures.get("scanner")!,
      // We load the instructions font separately as its used in a different GL context
      instructionsFont: instructionFont,
    },
    shaderSource: {
      stardust: namedShaders.get("stardust")!,
      ship: namedShaders.get("ship")!,
      planet: namedShaders.get("planet")!,
      sun: namedShaders.get("sun")!,
      uColor: namedShaders.get("uColor")!,
      text: namedShaders.get("text")!,
      simpleTexture: namedShaders.get("simpleTexture")!,
      crt: namedShaders.get("crt")!,
      amberCrt: namedShaders.get("ambercrt")!,
      greenCrt: namedShaders.get("greencrt")!,
      vcr: namedShaders.get("vcr")!,
      motionBlur: namedShaders.get("motionblur")!,
    },
    soundEffects: await createSoundEffects(),
  }
}

function getNamedShip(
  ships: ShipBlueprint[],
  name: string,
  position: vec3,
  noseOrientation: vec3,
  role?: ShipRoleEnum,
) {
  return toInstance(ships.find((s) => s.name === name)!, position, noseOrientation, role)
}

function toInstance(ship: ShipBlueprint, position: vec3, noseOrientation: vec3, role?: ShipRoleEnum) {
  const orientations = calculateOrientationsFromNose(noseOrientation)

  return {
    role: role ?? ShipRoleEnum.Trader,
    blueprint: ship,
    position: vec3.copy(vec3.create(), position),
    noseOrientation: vec3.copy(vec3.create(), noseOrientation),
    roofOrientation: vec3.copy(vec3.create(), orientations.roofOrientation),
    rightOrientation: vec3.copy(vec3.create(), orientations.sideOrientation),
    roll: 0.0,
    pitch: 0.0,
    speed: 0.0,
    rendering: {
      shininess: 16.0,
    },
    boundingBox: ship.renderingModel.boundingBox.map((v) => vec3.copy(vec3.create(), v)),
    aggressionLevel: Math.floor(Math.random() * 32),
    hasECM: false,
    hasEscapePod: false,
    aiEnabled: false,
    missiles: ship.maxAiMissiles,
    attitude: AttitudeEnum.Friendly,
    energy: ship.maxAiEnergy,
    timeLeftFiringLasers: null,
    timeUntilCanFireAgain: null,
    fixedDirectionOfMovement: ship.fixedDirectionOfMovement ? vec3.copy(vec3.create(), noseOrientation) : null,
    acceleration: AccelerationModeEnum.None,
    rollAcceleration: AccelerationModeEnum.None,
    pitchAcceleration: AccelerationModeEnum.None,
    isDestroyed: false,
    tacticsState: {
      timeUntilNextStateChange: 0,
      flyingTowards: FlyingTowardsEnum.None,
      canApplyTactics: false,
    },
  } as ShipInstance
}

function getRandomShip(ships: ShipBlueprint[]) {
  return ships[Math.floor(Math.random() * ships.length)]
}

async function loadShipSpecifications(gl: WebGL2RenderingContext): Promise<ShipBlueprint[]> {
  const playerDefaults = {
    rollAcceleration: shipMovementSpeeds.rollAcceleration,
    rollDeceleration: shipMovementSpeeds.rollDeceleration,
    maxRollSpeed: shipMovementSpeeds.maxRollSpeed,
    pitchAcceleration: shipMovementSpeeds.pitchAcceleration,
    pitchDeceleration: shipMovementSpeeds.pitchDeceleration,
    maxPitchSpeed: shipMovementSpeeds.maxPitchSpeed,
    speedAcceleration: shipMovementSpeeds.speedAcceleration,

    numberOfEnergyBanks: 4,
    maxEnergy: 255,
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
      model: ShipModelEnum.CobraMk3,
      renderingModel: loadModel(gl, "ships/cobra3.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/cobra3.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 2,
      maxSpeed: shipMovementSpeeds.maxSpeed,
      canBeTrader: true,
      canBePirate: true,
      canBeBountyHunter: true,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 3,
      targetableArea: 95 * 95,
      laserPower: 2,
      maxAiMissiles: 3,
      maxAiEnergy: 150,
      bounty: 0,
      canBeRockHermit: false,
    },
    {
      name: "Adder",
      model: ShipModelEnum.Adder,
      renderingModel: loadModel(gl, "ships/adder.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/adder.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 4,
      maxSpeed: 24,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 0,
      targetableArea: 50 * 50,
      laserPower: 2,
      maxAiMissiles: 0,
      maxAiEnergy: 85,
      bounty: 4.0,
      canBeRockHermit: true,
    },
    {
      name: "Anaconda",
      model: ShipModelEnum.Anaconda,
      renderingModel: loadModel(gl, "ships/anaconda.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/anaconda.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 1.5,
      maxSpeed: 14,
      canBeTrader: true,
      canBePirate: false,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 7,
      targetableArea: 100 * 100,
      laserPower: 7,
      maxAiMissiles: 7,
      maxAiEnergy: 252,
      bounty: 0,
      canBeRockHermit: false,
    },
    {
      name: "Asp",
      model: ShipModelEnum.Asp,
      renderingModel: loadModel(gl, "ships/asp2.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/asp2.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      maxSpeed: 40,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: true,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 0,
      targetableArea: 60 * 60,
      laserPower: 5,
      maxAiMissiles: 1,
      maxAiEnergy: 150,
      bounty: 20.0,
      canBeRockHermit: false,
    },
    {
      name: "Asteroid",
      model: ShipModelEnum.Asteroid,
      renderingModel: loadModel(gl, "ships/asteroid.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/asteroid.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 2,
      maxSpeed: 10,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: true,
      maxCanistersOnDeath: 0,
      targetableArea: 80 * 80,
      laserPower: 0,
      maxAiMissiles: 0,
      maxAiEnergy: 60,
      bounty: 0.5,
      canBeRockHermit: false,
    },
    {
      name: "Boa",
      model: ShipModelEnum.Boa,
      renderingModel: loadModel(gl, "ships/boa.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/boa.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 2,
      maxSpeed: 24,
      canBeTrader: true,
      canBePirate: false,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 5,
      targetableArea: 70 * 70,
      laserPower: 3,
      maxAiMissiles: 4,
      maxAiEnergy: 250,
      bounty: 0,
      canBeRockHermit: false,
    },
    {
      name: "Boulder",
      model: ShipModelEnum.Boulder,
      renderingModel: loadModel(gl, "ships/boulder.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/boulder.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 4,
      maxSpeed: 12,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: true,
      maxCanistersOnDeath: 0,
      targetableArea: 30 * 30,
      laserPower: 0,
      maxAiMissiles: 0,
      maxAiEnergy: 20,
      bounty: 0.1,
      canBeRockHermit: false,
    },
    {
      name: "Cargo",
      model: ShipModelEnum.Cargo,
      renderingModel: loadModel(gl, "ships/cargo.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/cargo.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 6,
      maxSpeed: 20,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: true,
      maxCanistersOnDeath: 0,
      targetableArea: 20 * 20,
      laserPower: 0,
      maxAiMissiles: 0,
      maxAiEnergy: 17,
      bounty: 0,
      canBeRockHermit: false,
    },
    {
      name: "Cobra Mk I",
      model: ShipModelEnum.CobraMk1,
      renderingModel: loadModel(gl, "ships/cobra1.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/cobra1.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      maxSpeed: 26,
      canBeTrader: false,
      canBePirate: true,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 3,
      targetableArea: 99 * 99,
      laserPower: 2,
      maxAiMissiles: 2,
      maxAiEnergy: 90,
      bounty: 7.5,
      canBeRockHermit: false,
    },
    {
      name: "Constrictor",
      model: ShipModelEnum.Constrictor,
      renderingModel: loadModel(gl, "ships/constric.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/constric.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      maxSpeed: 36,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 3,
      targetableArea: 65 * 65,
      laserPower: 6,
      maxAiMissiles: 4,
      maxAiEnergy: 252,
      bounty: 0,
      canBeRockHermit: false,
    },
    {
      name: "Coriolis",
      model: ShipModelEnum.Coriolis,
      renderingModel: loadModel(gl, "ships/coriolis.obj", stationScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/coriolis.obj", stationScaleFactor),
      ...playerDefaults,
      pregameScale: 0.25,
      maxSpeed: 0,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 0,
      targetableArea: 160 * 160,
      laserPower: 0,
      maxAiMissiles: 6,
      maxAiEnergy: 240,
      bounty: 0,
      canBeRockHermit: false,
    },
    {
      name: "Dodo",
      model: ShipModelEnum.Dodo,
      renderingModel: loadModel(gl, "ships/dodo.obj", stationScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/dodo.obj", stationScaleFactor),
      ...playerDefaults,
      pregameScale: 0.2,
      maxSpeed: 0,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 0,
      targetableArea: 180 * 180,
      laserPower: 0,
      maxAiMissiles: 0,
      maxAiEnergy: 240,
      bounty: 0,
      canBeRockHermit: false,
    },
    {
      name: "Escape Pod",
      model: ShipModelEnum.EscapePod,
      renderingModel: loadModel(gl, "ships/escape.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/escape.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 6,
      maxSpeed: 8,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 0,
      targetableArea: 16 * 16,
      laserPower: 0,
      maxAiMissiles: 0,
      maxAiEnergy: 17,
      bounty: 0,
      canBeRockHermit: false,
    },
    {
      name: "Fer de Lance",
      model: ShipModelEnum.FerDeLance,
      renderingModel: loadModel(gl, "ships/ferdelan.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/ferdelan.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      maxSpeed: 30,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: true,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 0,
      targetableArea: 40 * 40,
      laserPower: 2,
      maxAiMissiles: 3,
      maxAiEnergy: 160,
      bounty: 0,
      canBeRockHermit: false,
    },
    {
      name: "Gecko",
      model: ShipModelEnum.Gecko,
      renderingModel: loadModel(gl, "ships/gecko.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/gecko.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      maxSpeed: 30,
      canBeTrader: false,
      canBePirate: true,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 0,
      targetableArea: 99 * 99,
      laserPower: 2,
      maxAiMissiles: 0,
      maxAiEnergy: 70,
      bounty: 5.5,
      canBeRockHermit: true,
    },
    {
      name: "Krait",
      model: ShipModelEnum.Krait,
      renderingModel: loadModel(gl, "ships/krait.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/krait.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 2.5,
      maxSpeed: 30,
      canBeTrader: false,
      canBePirate: true,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 1,
      targetableArea: 60 * 60,
      laserPower: 2,
      maxAiMissiles: 0,
      maxAiEnergy: 80,
      bounty: 10.0,
      canBeRockHermit: true,
    },
    {
      name: "Mamba",
      model: ShipModelEnum.Mamba,
      renderingModel: loadModel(gl, "ships/mamba.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/mamba.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      maxSpeed: 32,
      canBeTrader: false,
      canBePirate: true,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 1,
      targetableArea: 70 * 70,
      laserPower: 2,
      maxAiMissiles: 2,
      maxAiEnergy: 90,
      bounty: 15.0,
      canBeRockHermit: true,
    },
    {
      name: "Missile",
      model: ShipModelEnum.Missile,
      renderingModel: loadModel(gl, "ships/missile.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/missile.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 7,
      maxSpeed: 44,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 0,
      targetableArea: 40 * 40,
      laserPower: 0,
      maxAiMissiles: 0,
      maxAiEnergy: 2,
      bounty: 0,
      canBeRockHermit: false,
    },
    {
      name: "Moray",
      model: ShipModelEnum.Moray,
      renderingModel: loadModel(gl, "ships/moray.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/moray.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      maxSpeed: 25,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 1,
      targetableArea: 30 * 30,
      laserPower: 2,
      maxAiMissiles: 0,
      maxAiEnergy: 100,
      bounty: 5.0,
      canBeRockHermit: false,
    },
    {
      name: "Python",
      model: ShipModelEnum.Python,
      renderingModel: loadModel(gl, "ships/python.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/python.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 1.5,
      maxSpeed: 20,
      canBeTrader: true,
      canBePirate: false,
      canBeBountyHunter: true,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 5,
      targetableArea: 80 * 80,
      laserPower: 3,
      maxAiMissiles: 3,
      maxAiEnergy: 250,
      bounty: 0,
      canBeRockHermit: false,
    },
    {
      name: "Shuttle",
      model: ShipModelEnum.Shuttle,
      renderingModel: loadModel(gl, "ships/shuttle.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/shuttle.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 4,
      maxSpeed: 8,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 15,
      targetableArea: 50 * 50,
      laserPower: 0,
      maxAiMissiles: 0,
      maxAiEnergy: 32,
      bounty: 0,
      canBeRockHermit: false,
    },
    {
      name: "Sidewinder",
      model: ShipModelEnum.Sidewinder,
      renderingModel: loadModel(gl, "ships/sidewind.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/sidewind.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      maxSpeed: 37,
      canBeTrader: false,
      canBePirate: true,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 0,
      targetableArea: 65 * 65,
      laserPower: 2,
      maxAiMissiles: 0,
      maxAiEnergy: 70,
      bounty: 5.0,
      canBeRockHermit: true,
    },
    {
      name: "Thargoid",
      model: ShipModelEnum.Thargoid,
      renderingModel: loadModel(gl, "ships/thargoid.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/thargoid.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 1.2,
      maxSpeed: 39,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 7,
      targetableArea: 99 * 99,
      laserPower: 2,
      maxAiMissiles: 6,
      maxAiEnergy: 240,
      bounty: 50.0,
      canBeRockHermit: false,
    },
    {
      name: "Transporter",
      model: ShipModelEnum.Transporter,
      renderingModel: loadModel(gl, "ships/trans.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/trans.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      maxSpeed: 10,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 0,
      targetableArea: 50 * 50,
      laserPower: 0,
      maxAiMissiles: 0,
      maxAiEnergy: 32,
      bounty: 0,
      canBeRockHermit: false,
    },
    {
      name: "Viper",
      model: ShipModelEnum.Viper,
      renderingModel: loadModel(gl, "ships/viper.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/viper.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3.5,
      maxSpeed: 32,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 0,
      targetableArea: 75 * 75,
      laserPower: 2,
      maxAiMissiles: 1,
      maxAiEnergy: 140,
      bounty: 0,
      canBeRockHermit: false,
    },
    {
      name: "Worm",
      model: ShipModelEnum.Worm,
      renderingModel: loadModel(gl, "ships/worm.obj", shipScaleFactor),
      explosion: loadExplosionFromModel(gl, "ships/worm.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 4,
      maxSpeed: 23,
      canBeTrader: false,
      canBePirate: true,
      canBeBountyHunter: false,
      fixedDirectionOfMovement: false,
      maxCanistersOnDeath: 0,
      targetableArea: 99 * 99,
      laserPower: 1,
      maxAiMissiles: 0,
      maxAiEnergy: 30,
      bounty: 0,
      canBeRockHermit: false,
    },
  ]
  const loadedShips = await Promise.all(loadingShips.map((ls) => ls.renderingModel))
  const explodedShips = await Promise.all(loadingShips.map((ls) => ls.explosion))
  return loadingShips.map((ls, lsi) => ({
    ...ls,
    renderingModel: loadedShips[lsi],
    explosion: explodedShips[lsi],
  }))
}
