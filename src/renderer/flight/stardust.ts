// We might be able to use gl_PointSize to draw the starfield. Maybe.
//  https://webglfundamentals.org/webgl/lessons/webgl-points-lines-triangles.html

import { LocalBubble } from "../../model/localBubble"
import { compileShaderProgram, compileShaderProgramFromSource } from "../../shader"
import { mat4 } from "gl-matrix"
import { Resources } from "../../resources/resources"
import { Game } from "../../model/game"

interface ProgramInfo {
  program: WebGLProgram
  attribLocations: {
    position: number
  }
  uniformLocations: {
    projectionMatrix: WebGLUniformLocation
    depth: WebGLUniformLocation
    jumping: WebGLUniformLocation
  }
}

function initShaderProgram(gl: WebGL2RenderingContext, resources: Resources) {
  const shaderProgram = compileShaderProgramFromSource(gl, resources.shaderSource.stardust)
  if (!shaderProgram) {
    return null
  }

  return {
    program: shaderProgram,
    attribLocations: {
      position: gl.getAttribLocation(shaderProgram, "position"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!,
      depth: gl.getUniformLocation(shaderProgram, "uDepth")!,
      jumping: gl.getUniformLocation(shaderProgram, "uJumping")!,
    },
  } as ProgramInfo
}

function setPositionAttribute(gl: WebGL2RenderingContext, buffer: WebGLBuffer, programInfo: ProgramInfo) {
  const numComponents = 3 // pull out 2 values per iteration
  const type = gl.FLOAT // the data in the buffer is 32bit floats
  const normalize = false // don't normalize
  const stride = 0 // how many bytes to get from one set of values to the next
  // 0 = use type and numComponents above
  const offset = 0 // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.vertexAttribPointer(programInfo.attribLocations.position, numComponents, type, normalize, stride, offset)
  gl.enableVertexAttribArray(programInfo.attribLocations.position)
}

export function createStardustRenderer(gl: WebGL2RenderingContext, resources: Resources) {
  const programInfo = initShaderProgram(gl, resources)!

  const dispose = () => {}

  const render = (game: Game) => {
    const localBubble = game.localBubble
    const positions = localBubble.stardust.flatMap((pos) => [pos[0], pos[1], pos[2]])
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

    const projectionMatrix = mat4.create()
    mat4.ortho(projectionMatrix, -0.5, 0.5, -0.5, 0.5, 0, localBubble.clipSpaceRadius)

    gl.useProgram(programInfo.program)

    // Set the shader uniforms
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix)
    gl.uniform1f(programInfo.uniformLocations.depth, localBubble.clipSpaceRadius - 2.0)
    gl.uniform1i(programInfo.uniformLocations.jumping, game.player.isJumping ? 1 : 0)

    setPositionAttribute(gl, positionBuffer!, programInfo)

    {
      const vertexCount = localBubble.stardust.length
      gl.drawArrays(gl.POINTS, 0, vertexCount)
    }

    gl.deleteBuffer(positionBuffer)
  }

  return { render, dispose }
}
