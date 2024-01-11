// the positions are 8-bits but a galaxy looks to be sized 102.4x51.2 so we scale here
import {vec3, vec4} from "gl-matrix";

export const galaxySize = { width: 102.4, height: 51.2 }
export const frameWidth = 4.0
export const frameColor = vec4.fromValues(1.0,1.0,0.0,1.0)

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
variable.
*/

// Based on the above and the Elite world size (
export const playerOrbitalBodyRelativeSpeedFudgeFactor = 2
export const playerShipRelativeSpeedFudgeFactor = 2
export const shipScaleFactor = 0.1
export const stationScaleFactor = shipScaleFactor * 2.0
export const scannerRadialWorldRange = vec3.divide(vec3.create(),vec3.fromValues(0x3300, 0x3300, 0x3300),[8,8,8])
export const worldSize = 8388607 // max value of a signed 24-bit number
