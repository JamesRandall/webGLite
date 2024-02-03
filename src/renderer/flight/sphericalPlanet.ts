import { compileShaderProgram, compileShaderProgram2 } from "../../shader"
import { LocalBubble } from "../../model/localBubble"
import { mat4, quat, vec3 } from "gl-matrix"
import { createSphere } from "../../resources/sphere"
import { Resources } from "../../resources/resources"
import { setCommonAttributes, setViewUniformLocations } from "../coregl/programInfo"
import { planetScaleFactor } from "../../constants"

function initShaderProgram(gl: WebGL2RenderingContext, resources: Resources) {
  const shaderProgram = compileShaderProgram2(gl, resources.shaderSource.planet)
  if (!shaderProgram) {
    return null
  }

  return {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
      textureCoords: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!,
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!,
      normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix")!,
      lightWorldPosition: gl.getUniformLocation(shaderProgram, "uLightWorldPosition")!,
      shininess: gl.getUniformLocation(shaderProgram, "uShininess")!,
      textureSampler: gl.getUniformLocation(shaderProgram, "uSampler")!,
    },
  }
}

export function createSphericalPlanetRenderer(gl: WebGL2RenderingContext, resources: Resources) {
  const programInfo = initShaderProgram(gl, resources)!

  const sphere = createSphere(gl, {
    radius: 1,
    subdivisionsAxis: 120,
    subdivisionsHeight: 60,
    textureFile: "./meridian.png",
  })

  return function (projectionMatrix: mat4, localBubble: LocalBubble, timeDelta: number) {
    gl.useProgram(programInfo.program)

    const planet = localBubble.planet
    // Firstly we point the ship along the nose orientation
    const targetToMatrix = mat4.targetTo(mat4.create(), [0, 0, 0], planet.noseOrientation, planet.roofOrientation)
    const targetToQuat = mat4.getRotation(quat.create(), targetToMatrix)
    const viewPosition = planet.position
    const scaledRadius = planet.radius * planetScaleFactor
    const scale = vec3.fromValues(scaledRadius, scaledRadius, scaledRadius)
    const modelViewMatrix = mat4.fromRotationTranslationScale(mat4.create(), targetToQuat, viewPosition, scale)
    const normalMatrix = mat4.create()
    mat4.invert(normalMatrix, modelViewMatrix)
    mat4.transpose(normalMatrix, normalMatrix)

    setCommonAttributes(gl, sphere, programInfo)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.indices)
    setViewUniformLocations(
      gl,
      programInfo,
      {
        modelViewMatrix,
        normalMatrix,
        projectionMatrix,
        lightWorldPosition: localBubble.sun.position,
        shininess: 128,
        textureIndex: 0,
      },
      resources.textures.planets[planet.surfaceTextureIndex],
    )

    {
      const vertexCount = sphere.vertexCount
      const type = gl.UNSIGNED_SHORT
      const offset = 0
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
    }
  }
}
