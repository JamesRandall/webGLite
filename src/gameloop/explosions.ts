import { Game } from "../model/game"
import { RenderingModel } from "../resources/models"
import { PositionedObject } from "../model/localBubble"
import { vec3 } from "gl-matrix"
import { calculateOrientationsFromNose } from "../model/geometry"

export function replaceDestroyedShipsWithExplosions(game: Game, timeDelta: number) {
  game.localBubble.ships.forEach((ship) => {
    if (ship.isDestroyed) {
      const newExplosion = {
        parts: ship.blueprint.explosion,
        positions: ship.blueprint.explosion.map((e) => {
          const { noseOrientation, roofOrientation, sideOrientation } = calculateOrientationsFromNose(e.faceNormal!)
          return {
            position: ship.position,
            noseOrientation: noseOrientation, //ship.noseOrientation, // noseOrientation,
            roofOrientation: roofOrientation, // ship.roofOrientation, // roofOrientation,
            rightOrientation: sideOrientation, // ship.rightOrientation, // sideOrientation,
            roll: ship.roll + Math.random() - 0.5,
            pitch: ship.pitch + Math.random() - 0.5,
            fixedDirectionOfMovement: null,
            boundingBox: [],
            // Our faces have their own normals for lighting and the way they are facing, however the vertices of the
            // faces are expressed based on the orientation of the ships nose. Therefore when we come to display the
            // explosion we need to adjust our face orientation such that it is expressed in the same alignment as
            // the ships nose orientation.
            noseOrientationDelta: vec3.subtract(vec3.create(), ship.noseOrientation, noseOrientation),
            roofOrientationDelta: vec3.subtract(vec3.create(), ship.roofOrientation, roofOrientation),
            shininess: ship.rendering.shininess,
          }
        }),
        timeUntilDissipate: 30.0,
        // the explosion has an overall velocity based on the source objects velocity
        overallVelocity: vec3.fromValues(
          ship.noseOrientation[0] * ship.speed,
          ship.noseOrientation[1] * ship.speed,
          ship.noseOrientation[2] * ship.speed,
        ),
        // each component then has a velocity based on its original normal
        componentRelativeSpeed: ship.blueprint.explosion.map((e) => {
          //return vec3.fromValues(0, 0, 0)

          const randomisedNormal = vec3.add(vec3.create(), e.faceNormal!, [
            Math.random() * (e.faceNormal![0] > 0 ? 1 : -1),
            (Math.random() / 4) * (e.faceNormal![1] > 0 ? 1 : -1),
            (Math.random() / 4) * (e.faceNormal![2] > 0 ? 1 : -1),
          ])
          return vec3.multiply(vec3.create(), randomisedNormal, [
            5 + Math.random() * 10,
            5 + Math.random() * 10,
            5 + Math.random() * 10,
          ])
        }),
      }
      game.localBubble.explosions.push(newExplosion)
    }
  })

  game.localBubble.ships = game.localBubble.ships.filter((s) => !s.isDestroyed)
}
