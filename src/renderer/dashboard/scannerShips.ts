import { mat4, quat, vec3, vec4 } from "gl-matrix"
import { Game } from "../../model/game"
import { createSquareModel, Model } from "../../resources/models"
import { compileShaderProgram } from "../../shader"
import { scannerRadialWorldRange } from "../../constants"
// TODO: We need to rework this to use the shared style
const vsSource = `#version 300 es
    precision highp float;
    in vec4 aVertexPosition;
    
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
  `
const fsSource = `#version 300 es
precision highp float;

uniform vec4 uColor;

out lowp vec4 outputColor;

void main(void) {
    outputColor = uColor;
}
`

interface ProgramInfo {
  program: WebGLProgram
  attribLocations: {
    vertexPosition: number
  }
  uniformLocations: {
    projectionMatrix: WebGLUniformLocation
    modelViewMatrix: WebGLUniformLocation
    color: WebGLUniformLocation
  }
}

function initShaderProgram(gl: WebGLRenderingContext): ProgramInfo | null {
  const shaderProgram = compileShaderProgram(gl, vsSource, fsSource)
  if (!shaderProgram) {
    return null
  }

  return {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!,
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!,
      color: gl.getUniformLocation(shaderProgram, "uColor")!,
    },
  }
}

function setPositionAttribute(gl: WebGLRenderingContext, buffers: Model, programInfo: ProgramInfo) {
  const numComponents = 3 // pull out 2 values per iteration
  const type = gl.FLOAT // the data in the buffer is 32bit floats
  const normalize = false // don't normalize
  const stride = 0 // how many bytes to get from one set of values to the next
  // 0 = use type and numComponents above
  const offset = 0 // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
  gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset)
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)
}

export function createScannerShipRenderer(gl: WebGLRenderingContext, projectionMatrix: mat4, scale: vec3) {
  // TODO: we need to position this on the bottom middle i.e (-1.0,2.0 to 1.0,0.0)
  const verticalLine = [0.5, 0.0, 0.0, 1.5, 0.0, 0.0, 1.5, 1.0, 0.0, 0.5, 1.0, 0.0]
  const lineCap = [-0.5, 0.0, 0.0, 1.5, 0.0, 0.0, 1.5, 1, 0.0, -0.5, 1, 0.0]
  const verticalLineModel = createSquareModel(gl, [0.0, 1.0, 0.0, 1.0], verticalLine)
  const lineCapModel = createSquareModel(gl, [0.0, 1.0, 0.0, 1.0], lineCap)
  const programInfo = initShaderProgram(gl)!

  return function (game: Game) {
    if (game.player.isDocked) {
      return
    }

    game.localBubble.ships.forEach((ship) => {
      const normalisedPosition = vec3.divide(vec3.create(), ship.position, scannerRadialWorldRange)
      if (
        Math.abs(normalisedPosition[0]) > 1.0 ||
        Math.abs(normalisedPosition[1]) > 1.0 ||
        Math.abs(normalisedPosition[2]) > 1.0
      ) {
        // out of scanning range
        return
      }

      const scannerPosition = vec3.multiply(vec3.create(), [normalisedPosition[0], 0.05, normalisedPosition[2]], scale)
      let yScale = normalisedPosition[1] * scale[1]
      const verticalLineModelViewMatrix = mat4.fromRotationTranslationScale(
        mat4.create(),
        quat.create(),
        scannerPosition,
        [0.1, yScale, 1.0],
      )
      const lineCapPosition = vec3.add(vec3.create(), scannerPosition, [0, yScale - 0.05, 0])
      const lineCapModelViewMatrix = mat4.fromRotationTranslationScale(
        mat4.create(),
        quat.create(),
        lineCapPosition,
        [0.1, 0.1, 1.0],
      )

      gl.useProgram(programInfo.program)
      setPositionAttribute(gl, verticalLineModel, programInfo)
      gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, verticalLineModelViewMatrix)
      gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix)
      gl.uniform4f(programInfo.uniformLocations.color, 0.0, 1.0, 0.0, 1.0)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, verticalLineModel.indices)
      {
        const vertexCount = verticalLineModel.vertexCount
        const type = gl.UNSIGNED_SHORT
        const offset = 0
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
      }

      setPositionAttribute(gl, lineCapModel, programInfo)
      gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, lineCapModelViewMatrix)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineCapModel.indices)
      {
        const vertexCount = lineCapModel.vertexCount
        const type = gl.UNSIGNED_SHORT
        const offset = 0
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
      }
    })
  }
}
