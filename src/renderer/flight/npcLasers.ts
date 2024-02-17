import { createTriangleRenderer } from "../primitives/triangle"
import { dimensions } from "../../constants"
import { mat4, vec2, vec3, vec4 } from "gl-matrix"
import { Resources } from "../../resources/resources"
import { ShipInstance, ShipRoleEnum } from "../../model/ShipInstance"
import { createLineRenderer } from "../primitives/line"
import { projectPosition } from "../../model/geometry"

export function createNpcLaserRenderer(gl: WebGL2RenderingContext, resources: Resources) {
  return function renderNpcLasers(projectionMatrix: mat4, ship: ShipInstance) {
    if (ship.timeLeftFiringLasers === null) return

    // The code below is a bit weird but what it does is project the ships position into 2d space
    // It then takes the ships normal orientation, multiplies it by an amount, and projects that in 2d space
    // we then use the "gradient" between the two positions to create a line that is much longer.
    // If I try and do this with a big normal multiplier we end up with the line flipping directions due to the
    // projection math
    const sourcePosition = projectPosition(ship.position, projectionMatrix)
    const target3DPosition = vec3.add(
      vec3.create(),
      ship.position,
      vec3.multiply(vec3.create(), vec3.normalize(vec3.create(), ship.noseOrientation), [100, 100, 100]),
    )
    const targetPosition = projectPosition(target3DPosition, projectionMatrix)
    const xGrad = (sourcePosition[0] - targetPosition[0]) / dimensions.width
    const yGrad = (sourcePosition[1] - targetPosition[1]) / dimensions.mainViewHeight
    const endPosition = vec2.fromValues(sourcePosition[0] - xGrad * 100000, sourcePosition[1] - yGrad * 100000)

    const { render, dispose } = createLineRenderer(
      gl,
      dimensions.width,
      dimensions.mainViewHeight,
      [sourcePosition, endPosition],
      resources,
    )

    render([0, 0], [1, 1, 0, 1])
    dispose()
  }
}
