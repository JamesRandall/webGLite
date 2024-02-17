import { RenderingModel } from "../resources/models"
import { PositionedObject } from "./localBubble"
import { vec3 } from "gl-matrix"

export interface Explosion {
  parts: RenderingModel[]
  positions: PositionedObject[]
  timeUntilDissipate: number
  // the explosion has an overall velocity based on the source objects velocity
  overallVelocity: vec3
  // each component then has a velocity based on its original normal
  componentRelativeSpeed: vec3[]
  // in theory combining the above two should let the ship explode "outwards"
}
