import { compileShaderProgram2 } from "../../shader"
import { createSquareModel } from "../../resources/models"
import { mat4, quat, vec2 } from "gl-matrix"
import { setCommonAttributes, setViewUniformLocations } from "../coregl/programInfo"
import { Resources } from "../../resources/resources"

function initShaderProgram(gl: WebGL2RenderingContext, resources: Resources) {
  const shaderProgram = compileShaderProgram2(gl, resources.shaderSource.simpleTexture)
  if (!shaderProgram) {
    return null
  }

  return {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      textureCoords: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!,
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!,
      textureSampler: gl.getUniformLocation(shaderProgram, "uSampler")!,
    },
  }
}

export function createTexturedRectRenderer(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  resources: Resources,
) {
  const programInfo = initShaderProgram(gl, resources)!
  const square = createSquareModel(gl, [1.0, 0.0, 0.0, 1.0], null, true)
  const projectionMatrix = mat4.create()
  mat4.ortho(projectionMatrix, 0, width, height, 0, -1.0, 1.0)

  return function (position: vec2, size: vec2, texture: WebGLTexture) {
    // the divide by two is because the model has extents of -1.0 to 1.0
    const modelViewMatrix = mat4.fromRotationTranslationScale(
      mat4.create(),
      quat.create(),
      [position[0] + size[0] / 2, position[1] + size[1] / 2, 0.0],
      [size[0] / 2, size[1] / 2, 1.0],
    )

    gl.useProgram(programInfo.program)
    setCommonAttributes(gl, square, programInfo)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, square.indices)
    setViewUniformLocations(
      gl,
      programInfo,
      {
        projectionMatrix,
        modelViewMatrix,
        textureIndex: 0,
      },
      texture,
    )

    const vertexCount = square.vertexCount
    const type = gl.UNSIGNED_SHORT
    const offset = 0
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
  }
}
