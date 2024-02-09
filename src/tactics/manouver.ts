import { ShipInstance, ShipRoleEnum } from "../model/ShipInstance"
import { vec3 } from "gl-matrix"
import { Game } from "../model/game"
import { scannerRadialWorldRange } from "../constants"
import { aiFlag } from "./common"

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

export function steerShip(ship: ShipInstance, game: Game) {
  if (ship.role === ShipRoleEnum.Station) return
  if (isFarAway(ship)) {
    // this random check basically says the more aggressive the ship
    // the more likely it is to head towards us, the less aggressive the
    // more likely it is to head away
    if (Math.floor(Math.random() * 127) + 128 > aiFlag(ship)) {
      headShipAwayFromPlayer(ship, game)
    } else {
      headShipTowardsPlayer(ship, game)
    }
  } else {
    headShipAwayFromPlayer(ship, game)
  }
}

function headShipTowardsPlayer(ship: ShipInstance, game: Game) {
  // because the player is at 0,0,0 the ships needs to head towards the opposite of its position
  const playerDirection = vec3.multiply(vec3.create(), ship.position, [-1, -1, -1])
  headTowards(playerDirection, ship, game)
}

function headShipAwayFromPlayer(ship: ShipInstance, game: Game) {
  if (ship.role === ShipRoleEnum.Trader) {
    const planetDirection = vec3.subtract(vec3.create(), game.localBubble.planet.position, ship.position)
    headTowards(planetDirection, ship, game)
  } else {
    const awayFromPlayerDirection = ship.position
    headTowards(awayFromPlayerDirection, ship, game)
  }
}

function headTowards(direction: vec3, ship: ShipInstance, game: Game) {
  const normalisedDirection = vec3.normalize(vec3.create(), direction)
  const roofDotProduct = vec3.dot(normalisedDirection, ship.roofOrientation)
  if (Math.abs(roofDotProduct) > 0.2) {
    // pull up if roof dot product is positive, dive if negative
    ship.pitch = ship.blueprint.maxPitchSpeed * (roofDotProduct > 0 ? -1 : 1)
  } else {
    ship.pitch = 0
  }

  const sideDotProduct = vec3.dot(normalisedDirection, ship.rightOrientation)
  if (Math.abs(sideDotProduct) > 0.2) {
    // roll right if side dot product is positive, left if negative
    ship.roll = ship.blueprint.maxPitchSpeed * (sideDotProduct > 0 ? -1 : 1)
  } else {
    ship.roll = 0
  }
}
