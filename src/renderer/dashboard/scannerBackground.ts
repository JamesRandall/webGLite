import { compileShaderProgram2 } from "../../shader"
import { mat4, quat, vec3 } from "gl-matrix"
import { Resources } from "../../resources/resources"
import { setCommonAttributes, setViewUniformLocations } from "../coregl/programInfo"
import { createSquareModelWithLoadedTexture } from "../../resources/models"

interface ProgramInfo {
  program: WebGLProgram
  attribLocations: {
    vertexPosition: number
    textureCoords: number
  }
  uniformLocations: {
    projectionMatrix: WebGLUniformLocation
    modelViewMatrix: WebGLUniformLocation
    textureSampler: WebGLUniformLocation
  }
}

function initShaderProgram(gl: WebGL2RenderingContext, resources: Resources): ProgramInfo | null {
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

export function createScannerBackgroundRenderer(
  gl: WebGL2RenderingContext,
  resources: Resources,
  projectionMatrix: mat4,
  scale: vec3,
) {
  const programInfo = initShaderProgram(gl, resources)!
  const model = createSquareModelWithLoadedTexture(gl, resources.textures.scanner, true, false, true)

  const rotate = quat.rotateX(quat.create(), quat.create(), -90 * (Math.PI / 180))
  const position = vec3.fromValues(0, 0, 0)
  const modelViewMatrix = mat4.fromRotationTranslationScale(mat4.create(), rotate, position, scale)

  return function () {
    gl.useProgram(programInfo.program)
    setCommonAttributes(gl, model, programInfo)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indices)
    setViewUniformLocations(
      gl,
      programInfo,
      {
        projectionMatrix,
        modelViewMatrix,
        textureIndex: 0,
      },
      model.texture!,
    )

    {
      const vertexCount = model.vertexCount
      const type = gl.UNSIGNED_SHORT
      const offset = 0
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
    }
  }
}
