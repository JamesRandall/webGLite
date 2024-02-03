import { ShipBlueprint } from "../model/shipBlueprint"
import { vec3 } from "gl-matrix"
import { ShipInstance, ShipRoleEnum } from "../model/ShipInstance"
import { loadTexture } from "./texture"
import { loadModel } from "./models"
import { shipMovementSpeeds, shipScaleFactor, stationScaleFactor } from "../constants"
import { calculateOrientationsFromNose } from "../model/geometry"

export interface ShaderSource {
  frag: string
  vert: string
}

export interface Resources {
  ships: {
    numberOfShips: number
    traderIndexes: number[]
    getRandomShip: () => ShipBlueprint
    getIndexedShip: (index: number, position: vec3, noseOrientation: vec3) => ShipInstance
    getCobraMk3: (position: vec3, noseOrientation: vec3) => ShipInstance
    getThargoid: (position: vec3, noseOrientation: vec3) => ShipInstance
    getCoriolis: (position: vec3, noseOrientation: vec3) => ShipInstance
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
    .filter(({ s, i }) => s.canBeTrader)
    .map(({ s, i }) => i)

  return {
    ships: {
      numberOfShips: ships.length,
      traderIndexes,
      getRandomShip: () => getRandomShip(ships),
      getIndexedShip: (index: number, position: vec3, noseOrientation: vec3) =>
        toInstance(ships[index], position, noseOrientation),
      getCobraMk3: (position: vec3, noseOrientation: vec3) =>
        getNamedShip(ships, "Cobra Mk III", position, noseOrientation),
      getThargoid: (position: vec3, noseOrientation: vec3) =>
        getNamedShip(ships, "Thargoid", position, noseOrientation, ShipRoleEnum.Thargoid),
      getCoriolis: (position: vec3, noseOrientation: vec3) =>
        getNamedShip(ships, "Coriolis", position, noseOrientation, ShipRoleEnum.Station),
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
    totalRoll: 0.0,
    pitch: 0.0,
    totalPitch: 0.0,
    speed: 0.0,
    rendering: {
      shininess: 16.0,
    },
    boundingBox: ship.model.boundingBox.map((v) => vec3.copy(vec3.create(), v)),
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
    maxSpeed: shipMovementSpeeds.maxSpeed,

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
      canBeTrader: true,
      canBePirate: true,
      canBeBountyHunter: true,
    },
    {
      name: "Adder",
      model: loadModel(gl, "ships/adder.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 4,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
    },
    {
      name: "Anaconda",
      model: loadModel(gl, "ships/anaconda.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 1.5,
      canBeTrader: true,
      canBePirate: false,
      canBeBountyHunter: false,
    },
    {
      name: "Asp",
      model: loadModel(gl, "ships/asp2.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: true,
    },
    {
      name: "Asteroid",
      model: loadModel(gl, "ships/asteroid.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 2,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
    },
    {
      name: "Boa",
      model: loadModel(gl, "ships/boa.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 2,
      canBeTrader: true,
      canBePirate: false,
      canBeBountyHunter: false,
    },
    {
      name: "Boulder",
      model: loadModel(gl, "ships/boulder.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 4,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
    },
    {
      name: "Cargo",
      model: loadModel(gl, "ships/cargo.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 6,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
    },
    {
      name: "Cobra Mk I",
      model: loadModel(gl, "ships/cobra1.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      canBeTrader: false,
      canBePirate: true,
      canBeBountyHunter: false,
    },
    {
      name: "Constrictor",
      model: loadModel(gl, "ships/constric.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
    },
    {
      name: "Coriolis",
      model: loadModel(gl, "ships/coriolis.obj", stationScaleFactor),
      ...playerDefaults,
      pregameScale: 0.25,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
    },
    {
      name: "Dodo",
      model: loadModel(gl, "ships/dodo.obj", stationScaleFactor),
      ...playerDefaults,
      pregameScale: 0.2,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
    },
    {
      name: "Escape Pod",
      model: loadModel(gl, "ships/escape.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 6,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
    },
    {
      name: "Fer de Lance",
      model: loadModel(gl, "ships/ferdelan.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: true,
    },
    {
      name: "Gecko",
      model: loadModel(gl, "ships/gecko.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      canBeTrader: false,
      canBePirate: true,
      canBeBountyHunter: false,
    },
    {
      name: "Krait",
      model: loadModel(gl, "ships/krait.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 2.5,
      canBeTrader: false,
      canBePirate: true,
      canBeBountyHunter: false,
    },
    {
      name: "Mamba",
      model: loadModel(gl, "ships/mamba.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      canBeTrader: false,
      canBePirate: true,
      canBeBountyHunter: false,
    },
    {
      name: "Missile",
      model: loadModel(gl, "ships/missile.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 7,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
    },
    {
      name: "Moray",
      model: loadModel(gl, "ships/moray.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
    },
    {
      name: "Python",
      model: loadModel(gl, "ships/python.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 1.5,
      canBeTrader: true,
      canBePirate: false,
      canBeBountyHunter: true,
    },
    {
      name: "Shuttle",
      model: loadModel(gl, "ships/shuttle.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 4,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
    },
    {
      name: "Sidewinder",
      model: loadModel(gl, "ships/sidewind.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      canBeTrader: false,
      canBePirate: true,
      canBeBountyHunter: false,
    },
    {
      name: "Thargoid",
      model: loadModel(gl, "ships/thargoid.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 1.2,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
    },
    {
      name: "Transporter",
      model: loadModel(gl, "ships/trans.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
    },
    {
      name: "Viper",
      model: loadModel(gl, "ships/viper.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 3.5,
      canBeTrader: false,
      canBePirate: false,
      canBeBountyHunter: false,
    },
    {
      name: "Worm",
      model: loadModel(gl, "ships/worm.obj", shipScaleFactor),
      ...playerDefaults,
      pregameScale: 4,
      canBeTrader: false,
      canBePirate: true,
      canBeBountyHunter: false,
    },
  ]
  const loadedShips = await Promise.all(loadingShips.map((ls) => ls.model))
  return loadingShips.map((ls, lsi) => ({
    ...ls,
    model: loadedShips[lsi],
  }))
}
