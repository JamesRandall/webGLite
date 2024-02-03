import { compileShaderProgram, compileShaderProgram2 } from "../../shader"
import { LocalBubble } from "../../model/localBubble"
import { mat4, quat, vec2 } from "gl-matrix"
import { setCommonAttributes, setViewUniformLocations } from "../coregl/programInfo"
import { Resources } from "../../resources/resources"

function initShaderProgram(gl: WebGL2RenderingContext, resources: Resources) {
  const shaderProgram = compileShaderProgram2(gl, resources.shaderSource.sun)
  if (!shaderProgram) {
    return null
  }

  return {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
      textureCoords: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!,
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!,
      normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix")!,
      textureSampler: gl.getUniformLocation(shaderProgram, "uSampler")!,
      mouse: gl.getUniformLocation(shaderProgram, "iMouse")!,
      time: gl.getUniformLocation(shaderProgram, "iTime")!,
      resolution: gl.getUniformLocation(shaderProgram, "iResolution")!,
    },
  }
}

export function createSunRenderer(gl: WebGL2RenderingContext, resources: Resources) {
  const programInfo = initShaderProgram(gl, resources)!

  let time = 0.0

  return function (projectionMatrix: mat4, localBubble: LocalBubble, timeDelta: number) {
    time += timeDelta

    gl.useProgram(programInfo.program)

    const sun = localBubble.sun
    const scale = sun.radius

    const targetToMatrix = mat4.targetTo(mat4.create(), [0, 0, 0], sun.noseOrientation, sun.roofOrientation)
    const targetToQuat = mat4.getRotation(quat.create(), targetToMatrix)
    const modelViewMatrix = mat4.fromRotationTranslationScale(mat4.create(), targetToQuat, sun.position, [
      scale,
      scale,
      1.0,
    ])
    const normalMatrix = mat4.create()
    mat4.invert(normalMatrix, modelViewMatrix)
    mat4.transpose(normalMatrix, normalMatrix)
    const resolution = vec2.fromValues(256.0, 256.0)
    const mouse = vec2.fromValues(32, 32)

    setCommonAttributes(gl, sun.model, programInfo)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sun.model.indices)
    setViewUniformLocations(
      gl,
      programInfo,
      {
        modelViewMatrix,
        normalMatrix,
        projectionMatrix,
        textureIndex: 0,
      },
      localBubble.sun.model.texture!,
    )

    gl.uniform2fv(programInfo.uniformLocations.mouse, mouse)
    gl.uniform2fv(programInfo.uniformLocations.resolution, resolution)
    gl.uniform1f(programInfo.uniformLocations.time, time)
    {
      const vertexCount = sun.model.vertexCount
      const type = gl.UNSIGNED_SHORT
      const offset = 0
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
    }
  }
}
