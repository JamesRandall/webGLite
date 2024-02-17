import { vec3 } from "gl-matrix"
import { RenderingModel } from "../resources/models"
import { ShipInstance } from "./ShipInstance"
import { Explosion } from "./explosion"

export interface PositionedObject {
  position: vec3
  noseOrientation: vec3
  roofOrientation: vec3
  rightOrientation: vec3
  roll: number
  pitch: number
  fixedDirectionOfMovement: vec3 | null // asteroids and boulders do not change direction as they pitch and roll
  boundingBox: vec3[]
}

export interface OrbitalBody extends PositionedObject {
  color: vec3
  initialOrientation: vec3
  //distance: number
  radius: number
  model: RenderingModel
  surfaceTextureIndex: number
}

export interface LocalBubble {
  sun: OrbitalBody
  planet: OrbitalBody
  clipSpaceRadius: number
  ships: ShipInstance[]
  explosions: Explosion[]
  // the station will also be in the ship instance array but we ref it here as otherwise we are constantly
  // looking it up
  station: ShipInstance | null
  stardust: vec3[]
  sunPlanetLightingDirection: vec3
}
