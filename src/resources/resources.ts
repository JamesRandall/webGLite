import { loadShipSpecifications, ShipBlueprint } from "../model/shipBlueprint"
import { vec3 } from "gl-matrix"
import { ShipInstance, ShipRoleEnum } from "../model/ShipInstance"
import { loadTexture } from "./texture"

export interface ShaderSource {
  frag: string
  vert: string
}

export interface Resources {
  ships: {
    numberOfShips: number
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
  gl: WebGLRenderingContext,
  instructionsGl: WebGLRenderingContext,
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
  return {
    ships: {
      numberOfShips: ships.length,
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
      planets: [
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
      ].map((t) => loadTexture(gl, t)!),
      noise: loadTexture(gl, "noise.png")!,
      font: loadTexture(gl, "font.png")!,
      starmask: loadTexture(gl, "starmask.png")!,
      scanner: loadTexture(gl, "scanner.png")!,
      // We load the instructions font separately as its used in a different GL context
      instructionsFont: loadTexture(instructionsGl, "font.png")!,
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
  return {
    role: role ?? ShipRoleEnum.Trader,
    blueprint: ship,
    position: position,
    noseOrientation: noseOrientation,
    roofOrientation: [0, 1, 0],
    rightOrientation: [1, 0, 0],
    roll: 0.0,
    totalRoll: 0.0,
    pitch: 0.0,
    totalPitch: 0.0,
    speed: 0.0,
    rendering: {
      shininess: 16.0,
    },
    boundingBox: [...ship.model.boundingBox],
  } as ShipInstance
}

function getRandomShip(ships: ShipBlueprint[]) {
  return ships[Math.floor(Math.random() * ships.length)]
}
