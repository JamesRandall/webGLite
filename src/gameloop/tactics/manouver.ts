import { AccelerationModeEnum, FlyingTowardsEnum, ShipInstance, ShipRoleEnum } from "../../model/ShipInstance"
import { vec3 } from "gl-matrix"
import { Game } from "../../model/game"
import { scannerRadialWorldRange, tacticsIntervalSeconds } from "../../constants"
import { aiFlag } from "./common"
import { log } from "../../gameConsole"

// Elite far away check looks at the high byte of Z being greater than 3 so a distance >= 768
// The Elite scanner range in the original game is 13056 (0x3300). 768 is = 768/13056 of that (as in 0.0588)
// so we calculate the distance relative to our scanner range in the same way
const isFarAwayRange = (768 / 13056) * scannerRadialWorldRange[2]
function isFarAway(ship: ShipInstance) {
  // The original game just uses Z for its is far away check using the calculation outlined above
  // it then looks for the high byte of x or y being 0 (ignoring bit 0)
  // we're not byte pushing or cpu constrained so we simplify this to just look at the overall
  // length of the vector
  // We also change it so that when heading away from the player the ship will try and move further off than the trigger
  // to initially begin turning away
  //return ship.position[2] > isFarAwayRange
  if (ship.tacticsState.flyingTowards === FlyingTowardsEnum.AwayFromPlayer) {
    return vec3.length(ship.position) > scannerRadialWorldRange[2] / 4
  }
  return vec3.length(ship.position) > isFarAwayRange
}

export function flyTowards(ship: ShipInstance, position: vec3) {}

export function rollShipByNoticeableAmount(ship: ShipInstance) {
  if (ship.roll === 0 && ship.tacticsState.canApplyTactics) {
    log("Rolling by noticeable amount")
    ship.roll = ship.blueprint.maxRollSpeed
  }
}

export function steerShip(ship: ShipInstance, game: Game, timeDelta: number) {
  if (ship.role === ShipRoleEnum.Station) return

  if (ship.tacticsState.canApplyTactics) {
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
  //if (orientationDotProduct > 0 && ship.speed > minSpeed) ship.acceleration = AccelerationModeEnum.Decelerating
  //else ship.acceleration = AccelerationModeEnum.Accelerating
  ship.acceleration = AccelerationModeEnum.Accelerating
}

function headShipAwayFromPlayer(ship: ShipInstance, game: Game) {
  if (ship.role === ShipRoleEnum.Trader) {
    ship.tacticsState.flyingTowards = FlyingTowardsEnum.Planet
    log("Trader flying towards planet")
  } else {
    //log(`${ship.role} heading away from player`)
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

  const orientationDotProduct = vec3.dot(vec3.normalize(vec3.create(), ship.noseOrientation), normalisedDirection)
  let angle = Math.acos(orientationDotProduct < -1 ? -1 : orientationDotProduct > 1 ? 1 : orientationDotProduct)
  const roofDotProduct = vec3.dot(normalisedDirection, ship.roofOrientation)

  // If we're facing away from the target direction then we always pitch, if we're facing then we only pitch towards our
  // target direction if it is not at a small angle
  if (Math.abs(roofDotProduct) > 0.005 || orientationDotProduct < 0) {
    ship.pitch += ship.blueprint.pitchAcceleration * timeDelta * (roofDotProduct > 0 ? -1 : 1)
    if (ship.pitch > ship.blueprint.maxPitchSpeed) ship.pitch = ship.blueprint.maxPitchSpeed
    else if (ship.pitch < -ship.blueprint.maxPitchSpeed) ship.pitch = -ship.blueprint.maxPitchSpeed

    // this prevents the ship from oscillating around the players position when coming head on
    if (ship.pitch > 0 && ship.pitch > angle) ship.pitch = angle
    else if (ship.pitch < 0 && ship.pitch < angle) ship.pitch = angle
  } else {
    // otherwise we start stopping our pitch motion
    let delta = ship.blueprint.pitchAcceleration * timeDelta
    if (ship.pitch < 0) {
      ship.pitch += delta
      if (ship.pitch > 0) {
        ship.pitch = 0
      }
    } else if (ship.pitch > 0) {
      ship.pitch -= delta
      if (ship.pitch < 0) {
        ship.pitch = 0
      }
    }
  }

  const sideDotProduct = vec3.dot(normalisedDirection, ship.rightOrientation)
  if (Math.abs(sideDotProduct) > 0.001) {
    ship.roll += ship.blueprint.rollAcceleration * timeDelta * (sideDotProduct > 0 ? 1 : -1)
    if (ship.roll > ship.blueprint.maxRollSpeed) ship.roll = ship.blueprint.maxRollSpeed
    else if (ship.roll < -ship.blueprint.maxRollSpeed) ship.roll = -ship.blueprint.maxRollSpeed
  } else {
    let delta = ship.blueprint.rollAcceleration * timeDelta
    if (ship.roll < 0) {
      ship.roll += delta
      if (ship.roll > 0) ship.roll = 0
    }
    if (ship.roll > 0) {
      ship.roll -= delta
      if (ship.roll < 0) ship.roll = 0
    }
    ship.roll = 0
  }

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