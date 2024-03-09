// the positions are 8-bits but a galaxy looks to be sized 102.4x51.2 so we scale here
import { vec3, vec4 } from "gl-matrix"

export const galaxySize = { width: 102.4, height: 51.2 }
export const frameWidth = 4.0
export const frameColor = vec4.fromValues(1.0, 1.0, 0.0, 1.0)

/*
To calibrate our co-ordinate system we use the range of the scanner in the original game.

Elite uses 23 bit numbers + 1 bit for the sign for ship co-ordinates. So +/- 23-bits. This is represented as:

    x = (x_sign x_hi x_lo)
    y = (y_sign y_hi y_lo)
    z = (z_sign z_hi z_lo)

The player is always at position (0,0,0) and the world "revolves", quite literally, around them.

The scanner shows ships that have a high byte that is < 63 (0x33) and so to be in range the ships must have co-ordinates:

    x > -0x3300 and x < 0x3300
    y > -0x3300 and x < 0x3300
    z > -0x3300 and x < 0x3300

Based on the above and attempting to time the speed things happen in Elite the below numbers attempt to scale
things so that things "feel" right in this interpretation. There isn't really n expression of things
"per second" in the code as things are expressed in terms of cycles of the main loop and the frame rate is very
variable.c
*/

// Based on the above and the Elite world size (
export const playerOrbitalBodyRelativeSpeedFudgeFactor = 2
export const playerShipRelativeSpeedFudgeFactor = 4
export const jumpSpeedMultiplier = 16
export const stardustJumpSpeedMultiplier = jumpSpeedMultiplier / 4
export const shipScaleFactor = 0.1
export const stationScaleFactor = shipScaleFactor * 4.0
export const scannerRadialWorldRange = vec3.divide(vec3.create(), vec3.fromValues(0x3300, 0x3300, 0x3300), [8, 8, 8])
export const worldSize = 8388607 // max value of a signed 24-bit number
export const dockingRollToleranceDegrees = 20
export const planetScaleFactor = 0.75
// every 256 times through the original game loop, based on an average frame rate of 15fps, will see how it feels
export const averageSpawnTimeInSecond = 256.0 / 15.0

export let dimensions = {
  width: 800,
  mainViewHeight: 560,
  dashboardHeight: 200,
  totalHeight: 760,
  crosshairLength: 32,
  crosshairSpace: 20,
}
export function setDimensions(width: number, height: number) {
  const dashboardHeight = 200 // always 200, fixed height
  dimensions = {
    width: width,
    mainViewHeight: height - dashboardHeight,
    totalHeight: height,
    crosshairSpace: 20,
    crosshairLength: 32,
    dashboardHeight: dashboardHeight,
  }
}

// measured in BBC Elite:
//   1.6 seconds to react max roll speed
//   9.5 seconds for roll to slow to zero
//   3.5 seconds to complete 360 degrees of roll at max roll speed
//   1 second to reach max pitch speed
//   7 seconds for pitch to slow to zero
//   10.6 seconds to complete 360 degrees of pitch at max pitch speed

// Pitch must be 8 times lower than roll

const maxRollSpeed = 2.0 * Math.PI // / 3.5
const maxPitchSpeed = (2.0 * Math.PI) / 8 // / 10
const maxSpeed = 30.0
export const shipMovementSpeeds = {
  maxRollSpeed: maxRollSpeed,
  rollAcceleration: maxRollSpeed / 2,
  rollDeceleration: maxRollSpeed / 7.0,
  maxPitchSpeed: maxPitchSpeed,
  pitchAcceleration: maxPitchSpeed, // / 1.0
  pitchDeceleration: maxPitchSpeed / 7.0,
  maxSpeed: maxSpeed,
  speedAcceleration: maxSpeed / 3.0,
}
export const tacticsIntervalSeconds = 1.0
export const stationTacticsIntervalSeconds = 0.25
// in the original game player energy refreshes each time from the main loop but enemy ships update in pairs (see
// applyTactics.ts) and so we use a different interval (based on 12 enemy ships) to refresh player energy
export const playerEnergyIntervalSeconds = tacticsIntervalSeconds / 6
export const playerLaserCooldownIntervalSeconds = tacticsIntervalSeconds / 12
export const pulseLaserFrequency = 1.0 / 4.0
export const beamLaserFrequency = 1.0 / 20.0
export const militaryLaserFrequency = 1.0 / 20.0
export const miningLaserFrequency = 1.0 / 3.0
// best reference for laser powers is:
// https://www.bbcelite.com/master/main/subroutine/sight.html
// and
// https://www.bbcelite.com/master/all/workspaces.html#pow
export const pulseLaserPower = 15
export const beamLaserPower = 15
// the below is based on ARMLAS in the original game which is set as:
// INT(128.5 + 1.5*POW) = 151
// The high bit signifies whether or not the laser pulses and so the power of the laser is:
// 151-128 = 23
export const militaryLaserPower = 23
export const miningLaserPower = 50
export const laserTemperaturePerPulse = 8
export const laserMaxTemperature = 242
export const missileDamageAmount = 250
