import { Game } from "../model/game"
import { RenderingModel } from "../resources/models"
import { PositionedObject } from "../model/localBubble"
import { vec3 } from "gl-matrix"

export function replaceDestroyedShipsWithExplosions(game: Game, timeDelta: number) {
  game.localBubble.ships.forEach((ship) => {
    if (ship.isDestroyed) {
      const newExplosion = {
        parts: ship.blueprint.explosion,
        positions: ship.blueprint.explosion.map(() => ({
          position: ship.position,
          noseOrientation: ship.noseOrientation,
          roofOrientation: ship.roofOrientation,
          rightOrientation: ship.rightOrientation,
          roll: ship.roll,
          pitch: ship.pitch,
        })),
        timeUntilDissipate: 10.0,
        // the explosion has an overall velocity based on the source objects velocity
        overallVelocity: vec3.fromValues(
          ship.noseOrientation[0] * ship.speed,
          ship.noseOrientation[1] * ship.speed,
          ship.noseOrientation[2] * ship.speed,
        ),
        // each component then has a velocity based on its original normal
        componentRelativeSpeed: ship.blueprint.explosion.map(() => vec3.fromValues(0, 0, 0)),
      }
      game.localBubble.explosions.push(newExplosion)
    }
  })

  game.localBubble.ships = game.localBubble.ships.filter((s) => !s.isDestroyed)
}
