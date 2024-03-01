import { Primitives } from "../primitives/primitives"
import { Game } from "../../model/game"
import { mat4, vec2, vec3 } from "gl-matrix"
import { compileShaderProgram2 } from "../../shader"
import { setPositionAttribute } from "../coregl/programInfo"
import { setupGl } from "../common"

// We have the shaders as static assets as we display this scene while the resources are loading
const vertexShader = `#version 300 es
in vec3 position;
uniform mat4 uProjectionMatrix;

out vec4 vColor;

void main() {
    vColor = vec4(1.0, 0.0, 0.0, 1.0);
    gl_PointSize = 2.0;
    gl_Position = uProjectionMatrix * vec4(position.xyz,1.0);
}
`
const fragmentShader = `#version 300 es
in lowp vec4 vColor;
out lowp vec4 outputColor;

void main(void) {
    outputColor = vColor;
    //gl_FragDepth = uDepth;
}
`
// We want a loading screen for a couple of reasons.
// One is I want the original Saturn screen in here as its iconinc and cool.
// The second is tht it takes a while for all the assets to load.
// The third is that interacting with the Play button on this screen lets
// the sounds play. Browser will complain about audio being played before
// the user has interacted with the page.
export function createLoadingScreenRenderer(gl: WebGL2RenderingContext) {
  const pointsPerFrame = 8
  const numberOfPlanetPoints = 1280
  let points: number[] = []
  let planetPointCount = 0
  const planetBias = 128 * 128 //Math.pow(128, 2)
  const width = gl.canvas.width
  const height = gl.canvas.height

  const projectionMatrix = mat4.create()
  // we probably want to set the height based on the aspect ratio
  mat4.ortho(projectionMatrix, -width / 2, width / 2, -height / 2, height / 2, 10, -10)

  const shaderProgram = compileShaderProgram2(gl, { frag: fragmentShader, vert: vertexShader })!
  const positionLocation = gl.getAttribLocation(shaderProgram, "position")!
  const projectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!

  let vertexBuffer = gl.createBuffer()!

  return (now: number, resourcesReady: boolean) => {
    const previousPointCount = points.length
    setupGl(gl)

    if (planetPointCount < numberOfPlanetPoints) {
      // todo base this on time rather than frame
      for (let i = 0; i < pointsPerFrame; i++) {
        const x = Math.round(Math.random() * 256) - 128
        const y = Math.round(Math.random() * 256) - 128
        const cd = x * x + y * y
        if (cd < planetBias) {
          const offsetX = Math.sqrt(planetBias - cd) * 2
          const offsetY = -y * 2
          points.push(offsetX) // x
          points.push(offsetY) // y
          points.push(-1) // z
        }
      }
      planetPointCount += pointsPerFrame
    }

    gl.useProgram(shaderProgram)
    if (points.length !== previousPointCount) {
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.DYNAMIC_DRAW)
    } else {
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    }

    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW)
    setPositionAttribute(gl, vertexBuffer, positionLocation, 3)

    const vertexCount = points.length / 3
    gl.drawArrays(gl.POINTS, 0, vertexCount)

    if (planetPointCount >= numberOfPlanetPoints && resourcesReady) {
      // TODO: wait for play to be pressed
      gl.deleteBuffer(vertexBuffer)
      return true
    }
    return false
  }
}
