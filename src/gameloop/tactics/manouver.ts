import { AccelerationModeEnum, FlyingTowardsEnum, ShipInstance, ShipRoleEnum } from "../../model/ShipInstance"
import { vec3 } from "gl-matrix"
import { Game } from "../../model/game"
import { scannerRadialWorldRange } from "../../constants"
import { aiFlag } from "./common"
import { log } from "../../gameConsole"
import { cleanNormalise } from "../../model/geometry"

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

  if (ship.role !== ShipRoleEnum.Missile) {
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

function getDirection(ship: ShipInstance, game: Game) {
  const target =
    ship.tacticsState.targetIndex !== null
      ? game.localBubble.ships.find((s) => s.id === ship.tacticsState.targetIndex) ?? null
      : null
  const planetDirection = vec3.subtract(vec3.create(), game.localBubble.planet.position, ship.position)
  if (ship.tacticsState.targetIndex !== null && target === null) {
    // if we can't find the ship with the given ID then its been removed / destroyed and so we let
    // the object targetted on it to continue on its current direction - and turn the AI off
    // so we don't bother again
    ship.tacticsState.targetIndex = null
    ship.aiEnabled = false
    return planetDirection
  }

  switch (ship.tacticsState.flyingTowards) {
    case FlyingTowardsEnum.ToTarget:
      return vec3.subtract(vec3.create(), target!.position, ship.position)
    case FlyingTowardsEnum.AwayFromPlayer:
      return vec3.copy(vec3.create(), ship.position)
    case FlyingTowardsEnum.Player:
      return vec3.subtract(vec3.create(), [0, 0, 0], ship.position) // towards the player
    case FlyingTowardsEnum.None:
    case FlyingTowardsEnum.Planet:
      return planetDirection
  }
}

function headTowards(ship: ShipInstance, game: Game, timeDelta: number) {
  if (ship.role === ShipRoleEnum.Missile) {
    headTowardsAcceleration(ship, game, timeDelta)
  } else {
    // TODO: Keep an eye on this
    // Experimenting with this - I'm not figuring out when I need to start decelerating but it might
    // lead to more natural movement nevertheless
    // I don't do this for the missile though because the missile needs to be accurate
    headTowardsAcceleration(ship, game, timeDelta)
  }
}

function headTowardsNoAcceleration(ship: ShipInstance, game: Game, timeDelta: number) {
  const direction = getDirection(ship, game)
  const normalisedDirection = cleanNormalise(direction)

  const ro = ship.roofOrientation
  const pDp = vec3.dot(normalisedDirection, ro)
  const orientationDotProduct = vec3.dot(vec3.normalize(vec3.create(), ship.noseOrientation), normalisedDirection)

  if (orientationDotProduct > 0 && Math.abs(pDp) < 0.005) {
    ship.pitch = 0
  } else {
    if (pDp > 0) {
      ship.pitch = -ship.blueprint.maxPitchSpeed
    } else if (pDp < 0) {
      ship.pitch = ship.blueprint.maxPitchSpeed
    } else {
      ship.pitch = 0
    }
  }

  const sideDotProduct = vec3.dot(normalisedDirection, cleanNormalise(ship.rightOrientation))
  if (sideDotProduct !== 0) debugger
  game.diagnostics.push(`${sideDotProduct}`)
  if (sideDotProduct > 0.03) {
    ship.roll = -ship.blueprint.maxRollSpeed
  } else if (sideDotProduct < -0.03) {
    ship.roll = ship.blueprint.maxRollSpeed
  } else {
    ship.roll = 0
  }

  const accelerationValue =
    ship.acceleration === AccelerationModeEnum.Accelerating || ship.role === ShipRoleEnum.Missile
      ? 1
      : ship.acceleration === AccelerationModeEnum.Decelerating
        ? -1
        : 0
  ship.speed += ship.blueprint.speedAcceleration * accelerationValue * timeDelta
  if (ship.speed > ship.blueprint.maxSpeed) ship.speed = ship.blueprint.maxSpeed
  else if (ship.speed < 0) ship.speed = 0
}

function headTowardsAcceleration(ship: ShipInstance, game: Game, timeDelta: number) {
  const direction = getDirection(ship, game)
  const normalisedDirection = vec3.normalize(vec3.create(), direction)

  const ro = ship.roofOrientation
  const pDp = vec3.dot(normalisedDirection, ro)
  const orientationDotProduct = vec3.dot(vec3.normalize(vec3.create(), ship.noseOrientation), normalisedDirection)
  const pitchDelta = timeDelta * ship.blueprint.pitchAcceleration
  const rollDelta = timeDelta * ship.blueprint.rollAcceleration
  const deceleratePitch = () => {
    if (ship.pitch > 0) {
      ship.pitch -= pitchDelta
      if (ship.pitch < 0) ship.pitch = 0
    } else if (ship.pitch < 0) {
      ship.pitch += pitchDelta
      if (ship.pitch > 0) ship.pitch = 0
    }
  }

  if (orientationDotProduct > 0 && Math.abs(pDp) < 0.1) {
    deceleratePitch()
  } else {
    if (pDp > 0) {
      ship.pitch -= pitchDelta
      if (ship.pitch < -ship.blueprint.maxPitchSpeed) ship.pitch = -ship.blueprint.maxPitchSpeed
    } else if (pDp < 0) {
      ship.pitch += pitchDelta
      if (ship.pitch > ship.blueprint.maxPitchSpeed) ship.pitch = ship.blueprint.maxPitchSpeed
    } else {
      deceleratePitch()
    }
  }

  const sideDotProduct = vec3.dot(normalisedDirection, ship.rightOrientation)
  game.diagnostics.push(`SDP ${sideDotProduct}`)
  if (sideDotProduct > 0) {
    ship.roll -= rollDelta
    if (ship.roll < -ship.blueprint.maxRollSpeed) ship.roll = -ship.blueprint.maxRollSpeed
  } else if (sideDotProduct < 0) {
    ship.roll += rollDelta
    if (ship.roll > ship.blueprint.maxRollSpeed) ship.roll = ship.blueprint.maxRollSpeed
  } else {
    ship.roll = 0
  }

  const accelerationValue =
    ship.acceleration === AccelerationModeEnum.Accelerating || ship.role === ShipRoleEnum.Missile
      ? 1
      : ship.acceleration === AccelerationModeEnum.Decelerating
        ? -1
        : 0
  ship.speed += ship.blueprint.speedAcceleration * accelerationValue * timeDelta
  if (ship.speed > ship.blueprint.maxSpeed) ship.speed = ship.blueprint.maxSpeed
  else if (ship.speed < 0) ship.speed = 0
}
