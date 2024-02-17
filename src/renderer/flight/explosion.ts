import { compileShaderProgram, compileShaderProgram2, loadShader } from "../../shader"
import { LocalBubble } from "../../model/localBubble"
import { mat4, quat, vec3 } from "gl-matrix"
import { setCommonAttributes, setViewUniformLocations } from "../coregl/programInfo"
import { Resources } from "../../resources/resources"
import { createNpcLaserRenderer } from "./npcLasers"

function initShaderProgram(gl: WebGL2RenderingContext, resources: Resources) {
  const shaderProgram = compileShaderProgram2(gl, resources.shaderSource.ship)
  if (!shaderProgram) {
    return null
  }

  return {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!,
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!,
      normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix")!,
      lightWorldPosition: gl.getUniformLocation(shaderProgram, "uLightWorldPosition")!,
      shininess: gl.getUniformLocation(shaderProgram, "uShininess")!,
    },
  }
}

export function createExplosionsRenderer(
  gl: WebGL2RenderingContext,
  resources: Resources,
  usePreGameScaleFactor: boolean = false,
) {
  const programInfo = initShaderProgram(gl, resources)!
  const npcLaser = createNpcLaserRenderer(gl, resources)

  return function (projectionMatrix: mat4, localBubble: LocalBubble) {
    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    gl.useProgram(programInfo.program)

    // Set the shader uniforms

    gl.uniform3fv(programInfo.uniformLocations.lightWorldPosition, localBubble.sun.position)
    //gl.uniform3fv(programInfo.uniformLocations.lightWorldPosition, [0,0,0]) // this puts the light at the player

    setViewUniformLocations(gl, programInfo, {
      projectionMatrix,
      lightWorldPosition: localBubble.sun.position,
    })

    localBubble.explosions.forEach((explosion) => {
      explosion.positions.forEach((ship, index) => {
        const renderingModel = explosion.parts[index]
        const targetToMatrix = mat4.targetTo(mat4.create(), [0, 0, 0], ship.noseOrientation, ship.roofOrientation)
        const targetToQuat = mat4.getRotation(quat.create(), targetToMatrix)
        const viewPosition = ship.position
        const modelViewMatrix = mat4.fromRotationTranslation(mat4.create(), targetToQuat, viewPosition)

        const normalMatrix = mat4.create()
        mat4.invert(normalMatrix, modelViewMatrix)
        mat4.transpose(normalMatrix, normalMatrix)

        setCommonAttributes(gl, renderingModel, programInfo)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderingModel.indices)
        setViewUniformLocations(gl, programInfo, {
          modelViewMatrix,
          normalMatrix,
          shininess: 16.0,
        })

        {
          const vertexCount = renderingModel.vertexCount
          const type = gl.UNSIGNED_SHORT
          const offset = 0
          gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
        }
      })
      // Firstly we point the ship along the nose orientation
    })
  }
}
