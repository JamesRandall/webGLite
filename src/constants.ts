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

We then set our view up with a far clipping plane at 512.0 pixels.

And so to render our ships we translate their position in world space to view space we convert between these two systems
using the ratio defined in worldToViewRatio (multiply the game co-ordinates by this vector)

I expect this to require some fiddling with to get things to feel right.
*/
export const scannerRadialWorldRange = vec3.fromValues(0x3300, 0x3300, 0x3300)
export const webglScannerRadialWorldRange = vec3.fromValues(512.0, 512.0, 512.0)
export const worldToViewRatio = vec3.divide(vec3.create(), webglScannerRadialWorldRange, scannerRadialWorldRange)