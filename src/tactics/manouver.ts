import { AccelerationModeEnum, FlyingTowardsEnum, ShipInstance, ShipRoleEnum } from "../model/ShipInstance"
import { vec3 } from "gl-matrix"
import { Game } from "../model/game"
import { scannerRadialWorldRange, tacticsFrequencySeconds } from "../constants"
import { aiFlag } from "./common"
import { log } from "../gameConsole"

// Elite far away check looks at the high byte of Z being greater than 3 so a distance >= 768
// The Elite scanner range in the original game is 13056 (0x3300). 768 is = 768/13056 of that (as in 0.0588)
// so we calculate the distance relative to our scanner range in the same way
const isFarAwayRange = (768 / 13056) * scannerRadialWorldRange[2]
function isFarAway(ship: ShipInstance) {
  // The original game just uses Z for its is far away check using the calculation outlined above
  // it then looks for the high byte of x or y being 0 (ignoring bit 0)
  // we're not byte pushing or cpu constrained so we simplify this to just look at the overall
  // length of the vector
  //return ship.position[2] > isFarAwayRange
  return vec3.length(ship.position) > isFarAwayRange
}

export function flyTowards(ship: ShipInstance, position: vec3) {}

export function rollShipByNoticeableAmount(ship: ShipInstance) {}

export function steerShip(ship: ShipInstance, game: Game, timeDelta: number) {
  if (ship.role === ShipRoleEnum.Station) return

  ship.tacticsState.timeUntilNextStateChange -= timeDelta
  if (ship.tacticsState.timeUntilNextStateChange < 0) {
    ship.tacticsState.timeUntilNextStateChange = tacticsFrequencySeconds
    if (isFarAway(ship)) {
      const aiFlagValue = aiFlag(ship)
      const aiRoll = Math.floor(Math.random() * 127) + 128
      log(`AI Flag: ${aiFlagValue}      AI Roll: ${aiRoll}`)
      // this random check basically says the more aggressive the ship
      // the more likely it is to head towards us, the less aggressive the
      // more likely it is to head away
      if (aiRoll > aiFlagValue) {
        headShipAwayFromPlayer(ship, game)
      } else {
        headShipTowardsPlayer(ship, game)
      }
    }
  }

  // If a ship gets too close to the player always head it away irrespective of the tactics timing
  if (!isFarAway(ship)) {
    headShipAwayFromPlayer(ship, game)
  }

  // This actually does the manouvering
  headTowards(ship, game, timeDelta)
}

function headShipTowardsPlayer(ship: ShipInstance, game: Game) {
  log(`${ship.role} heading towards player`)
  ship.tacticsState.flyingTowards = FlyingTowardsEnum.Player
  const minSpeed = ship.blueprint.maxSpeed / 4
  const orientationDotProduct = vec3.dot(ship.noseOrientation, [0, 0, -1])
  if (orientationDotProduct > 0 && ship.speed > minSpeed) ship.acceleration = AccelerationModeEnum.Decelerating
  else ship.acceleration = AccelerationModeEnum.Accelerating
}

function headShipAwayFromPlayer(ship: ShipInstance, game: Game) {
  if (ship.role === ShipRoleEnum.Trader) {
    ship.tacticsState.flyingTowards = FlyingTowardsEnum.Planet
    log("Trader flying towards planet")
  } else {
    log(`${ship.role} heading away from player`)
    ship.tacticsState.flyingTowards = FlyingTowardsEnum.AwayFromPlayer
  }
  ship.acceleration = AccelerationModeEnum.Accelerating
}

function headTowards(ship: ShipInstance, game: Game, timeDelta: number) {
  const direction =
    ship.tacticsState.flyingTowards === FlyingTowardsEnum.Planet
      ? vec3.subtract(vec3.create(), game.localBubble.planet.position, ship.position)
      : ship.tacticsState.flyingTowards === FlyingTowardsEnum.AwayFromPlayer
        ? ship.position
        : vec3.multiply(vec3.create(), ship.position, [-1, -1, -1]) // towards the player
  const normalisedDirection = vec3.normalize(vec3.create(), direction)

  const roofDotProduct = vec3.dot(normalisedDirection, ship.roofOrientation)
  game.diagnostics.push(`X: ${normalisedDirection[0]}`)
  game.diagnostics.push(`Y: ${normalisedDirection[1]}`)
  game.diagnostics.push(`Z: ${normalisedDirection[2]}`)
  game.diagnostics.push(`RDP: ${roofDotProduct}`)
  ship.pitch += ship.blueprint.pitchAcceleration * timeDelta * (roofDotProduct > 0 ? -1 : 1)
  if (ship.pitch > ship.blueprint.maxPitchSpeed) ship.pitch = ship.blueprint.maxPitchSpeed
  else if (ship.pitch < -ship.blueprint.maxPitchSpeed) ship.pitch = -ship.blueprint.maxPitchSpeed

  const sideDotProduct = vec3.dot(normalisedDirection, ship.rightOrientation)
  ship.roll += ship.blueprint.rollAcceleration * timeDelta * (sideDotProduct > 0 ? -1 : 1)
  if (ship.roll > ship.blueprint.maxRollSpeed) ship.roll = ship.blueprint.maxRollSpeed
  else if (ship.roll < -ship.blueprint.maxRollSpeed) ship.roll = -ship.blueprint.maxRollSpeed

  const accelerationValue =
    ship.acceleration === AccelerationModeEnum.Accelerating
      ? 1
      : ship.acceleration === AccelerationModeEnum.Decelerating
        ? -1
        : 0
  ship.speed += ship.blueprint.speedAcceleration * accelerationValue * timeDelta
  if (ship.speed > ship.blueprint.maxSpeed) ship.speed = ship.blueprint.maxSpeed
  else if (ship.speed < 0) ship.speed = 0
}
