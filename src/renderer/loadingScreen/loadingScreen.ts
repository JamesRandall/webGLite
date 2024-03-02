import { Primitives } from "../primitives/primitives"
import { Game } from "../../model/game"
import { mat4, quat, vec2, vec3 } from "gl-matrix"
import { compileShaderProgram2 } from "../../shader"
import { setPositionAttribute, setTextureAttribute } from "../coregl/programInfo"
import { setupGl } from "../common"
import { createSquareModel, createSquareModelWithLoadedTexture, RenderingModel } from "../../resources/models"
import { loadTexture } from "../../resources/texture"

// We have the shaders as static assets as we display this scene while the resources are loading
const vertexShader = `#version 300 es
in vec3 position;
uniform mat4 uProjectionMatrix;

void main() {
    gl_PointSize = 2.0;
    gl_Position = uProjectionMatrix * vec4(position.xyz,1.0);
}
`
const fragmentShader = `#version 300 es
out lowp vec4 outputColor;
uniform lowp vec4 uColor;

void main(void) {
    outputColor = uColor;
}
`

const imageVertexShader = `#version 300 es
precision highp float;
in vec3 position;
in vec2 textureCoords;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;

out highp vec2 vTextureCoord;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(position.xyz,1.0);
    vTextureCoord = textureCoords;
}
`
const imageFragmentShader = `#version 300 es
in highp vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform lowp float uAlpha;
out lowp vec4 outputColor;

void main(void) {
    lowp vec4 color = texture(uSampler, vTextureCoord);
    if (color.xyz != vec3(0,0,0)) { 
      outputColor = vec4(color.xyz, uAlpha);
    }
}
`

function createImageRenderer(
  gl: WebGL2RenderingContext,
  model: RenderingModel,
  projectionMatrix: mat4,
  pos: vec2,
  size: vec2,
) {
  const shaderProgram = compileShaderProgram2(gl, { frag: imageFragmentShader, vert: imageVertexShader })!
  const positionLocation = gl.getAttribLocation(shaderProgram, "position")!
  const textureCoordsLocation = gl.getAttribLocation(shaderProgram, "textureCoords")
  const projectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!
  const modelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!
  const samplerLocation = gl.getUniformLocation(shaderProgram, "uSampler")!
  const alphaLocation = gl.getUniformLocation(shaderProgram, "uAlpha")!

  const modelViewMatrix = mat4.fromRotationTranslationScale(
    mat4.create(),
    quat.create(),
    [pos[0], pos[1], -1],
    [size[0], size[1], 0],
  )

  return function render(alpha: number) {
    gl.useProgram(shaderProgram)
    setPositionAttribute(gl, model.position, positionLocation, 3)
    setTextureAttribute(gl, model.textureCoords, textureCoordsLocation)
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix)
    gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix)
    gl.uniform1f(alphaLocation, alpha)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, model.texture)
    gl.uniform1i(samplerLocation, 0)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indices)

    const vertexCount = model.vertexCount
    const type = gl.UNSIGNED_SHORT
    const offset = 0
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
  }
}

// We want a loading screen for a couple of reasons.
// One is I want the original Saturn screen in here as its iconinc and cool.
// The second is tht it takes a while for all the assets to load.
// The third is that interacting with the Play button on this screen lets
// the sounds play. Browser will complain about audio being played before
// the user has interacted with the page.
export async function createLoadingScreenRenderer(gl: WebGL2RenderingContext) {
  const numberOfPlanetPoints = 1800 // * 3 due to x,y,z
  const numberOfRingPoints = 1800
  const numberOfStarPoints = 140
  const pointsPerSecond = 1200

  const planetPoints: number[] = []
  const ringPoints: number[] = []
  const starPoints: number[] = []
  let planetPointVisits = 0
  let ringPointVisits = 0
  let starPointVisits = 0
  const planetBias = 128 * 128 //Math.pow(128, 2)
  const width = gl.canvas.width
  const height = gl.canvas.height

  const projectionMatrix = mat4.create()
  // we probably want to set the height based on the aspect ratio
  mat4.ortho(projectionMatrix, -width / 2, width / 2, -height / 2, height / 2, 10, -10)

  const shaderProgram = compileShaderProgram2(gl, { frag: fragmentShader, vert: vertexShader })!
  const positionLocation = gl.getAttribLocation(shaderProgram, "position")!
  const projectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!
  const colorLocation = gl.getUniformLocation(shaderProgram, "uColor")!

  const planetVertexBuffer = gl.createBuffer()!
  const ringVertexBuffer = gl.createBuffer()!
  const starVertexBuffer = gl.createBuffer()!

  const logoTexture = await loadTexture(gl, "./logo.png")
  const logo = createSquareModelWithLoadedTexture(gl, logoTexture)
  const logoRenderer = createImageRenderer(gl, logo, projectionMatrix, [0, 128 * 4 - 46 * 1.5], [239, 46])
  // 964x30
  const startTexture = await loadTexture(gl, "./start.png")
  const start = createSquareModelWithLoadedTexture(gl, startTexture)
  const startRenderer = createImageRenderer(gl, start, projectionMatrix, [0, -128 * 4 + 46], [723 / 2, 23 / 2])

  let previousTime = 0
  let isFirst = true
  let logoAlpha = 0.0
  let canProceed = false
  let proceed = false

  const proceedHandler = () => (proceed = canProceed && true)
  window.addEventListener("keydown", proceedHandler)
  window.addEventListener("mousedown", proceedHandler)

  return (now: number, resourcesReady: boolean) => {
    now *= 0.001
    if (isFirst) {
      previousTime = now
      isFirst = false
      return false
    }
    const delta = now - previousTime
    previousTime = now

    if (planetPoints.length >= numberOfPlanetPoints && ringPoints.length >= numberOfRingPoints && logoAlpha < 1.0) {
      logoAlpha += delta
    }

    const previousPlanetPointCount = planetPoints.length
    const previousRingPointCount = ringPoints.length
    const previousStarPointCount = starPoints.length
    setupGl(gl)
    gl.useProgram(shaderProgram)
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix)
    const pointsThisFrame = pointsPerSecond * delta
    if (planetPointVisits < numberOfPlanetPoints) {
      for (let i = 0; i < pointsThisFrame; i++) {
        const x = Math.round(Math.random() * 256) - 128
        const y = Math.round(Math.random() * 256) - 128
        const cd = x * x + y * y
        if (cd < planetBias) {
          const offsetX = Math.sqrt(planetBias - cd) * 2
          const offsetY = -y * 2
          planetPoints.push(offsetX) // x
          planetPoints.push(offsetY) // y
          planetPoints.push(-1) // z
        }
      }
      planetPointVisits += pointsThisFrame
    } else if (ringPointVisits < numberOfRingPoints) {
      for (let i = 0; i < pointsThisFrame; i++) {
        const xBase = Math.random() * 256 - 128
        const y = Math.round(Math.random() * 256 - 128)
        const x = Math.round(xBase / 4) + y
        const dist = (x * x + y * y) / 256
        const ellipseCheck = (17 * (x * x + y * y) - 32 * x * y) / 256
        if (ellipseCheck < 80 && ellipseCheck > 32 && (xBase < 0 || dist > 16)) {
          ringPoints.push(x * 4)
          ringPoints.push(-y * 4)
          ringPoints.push(-1)
        }
      }
      ringPointVisits += pointsThisFrame
    } else if (starPointVisits < numberOfStarPoints) {
      for (let i = 0; i < pointsThisFrame; i++) {
        const x = Math.random() * 256 - 128
        const y = Math.random() * 256 - 128
        const dist = (x * x + y * y) / 256
        if (dist > 17) {
          starPoints.push(x * 4)
          starPoints.push(-y * 4)
          starPoints.push(-1)
        }
      }
      starPointVisits += pointsThisFrame
    }

    if (planetPoints.length !== previousPlanetPointCount) {
      gl.bindBuffer(gl.ARRAY_BUFFER, planetVertexBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planetPoints), gl.DYNAMIC_DRAW)
    }
    setPositionAttribute(gl, planetVertexBuffer, positionLocation, 3)
    gl.uniform4fv(colorLocation, [1.0, 0.0, 0.0, 1.0])
    gl.drawArrays(gl.POINTS, 0, planetPoints.length / 3)

    if (ringPoints.length !== previousRingPointCount) {
      gl.bindBuffer(gl.ARRAY_BUFFER, ringVertexBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ringPoints), gl.DYNAMIC_DRAW)
    }
    setPositionAttribute(gl, ringVertexBuffer, positionLocation, 3)
    gl.uniform4fv(colorLocation, [1.0, 1.0, 0.0, 1.0])
    gl.drawArrays(gl.POINTS, 0, ringPoints.length / 3)

    if (starPoints.length !== previousStarPointCount) {
      gl.bindBuffer(gl.ARRAY_BUFFER, starVertexBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(starPoints), gl.DYNAMIC_DRAW)
    }
    setPositionAttribute(gl, starVertexBuffer, positionLocation, 3)
    gl.uniform4fv(colorLocation, [1.0, 1.0, 1.0, 1.0])
    gl.drawArrays(gl.POINTS, 0, starPoints.length / 3)

    logoRenderer(logoAlpha)
    startRenderer(logoAlpha)

    if (planetPoints.length >= numberOfPlanetPoints && ringPoints.length >= numberOfRingPoints && resourcesReady) {
      canProceed = true
      if (proceed) {
        window.removeEventListener("keydown", proceedHandler)
        window.removeEventListener("mousedown", proceedHandler)
      }
      return proceed
      // TODO: wait for play to be pressed
      //gl.deleteBuffer(planetVertexBuffer)
      //gl.deleteBuffer(ringVertexBuffer)
      //return true
    }
    return false
  }
}
