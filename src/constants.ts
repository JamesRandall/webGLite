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

export const dimensions = {
  width: 800,
  mainViewHeight: 560,
  dashboardHeight: 200,
  totalHeight: 760,
  crosshairLength: 32,
  crosshairSpace: 20,
}

// measured in BBC Elite:
//   1.6 seconds to react max roll speed
//   9.5 seconds for roll to slow to zero
//   3.5 seconds to complete 360 degrees of roll at max roll speed
//   1 second to reach max pitch speed
//   7 seconds for pitch to slow to zero
//   10.6 seconds to complete 360 degrees of pitch at max pitch speed
const maxRollSpeed = (2.0 * Math.PI) / 3.5
const maxPitchSpeed = (2.0 * Math.PI) / 10
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
export const tacticsFrequencySeconds = 2.0
export const stationTacticsFrequencySeconds = 0.25
