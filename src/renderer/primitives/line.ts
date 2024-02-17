import { compileShaderProgram2 } from "../../shader"
import { mat4, quat, vec2, vec3, vec4 } from "gl-matrix"
import { setCommonAttributes, setCommonAttributes2D, setViewUniformLocations } from "../coregl/programInfo"
import { Resources } from "../../resources/resources"

function initShaderProgram(gl: WebGL2RenderingContext, resources: Resources) {
  const shaderProgram = compileShaderProgram2(gl, resources.shaderSource.uColor)
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

function createVertexBuffer(gl: WebGL2RenderingContext, points: vec2[]) {
  const vertexBuffer = gl.createBuffer()
  //let vertices = [points[0][0], points[0][1], points[1][0], points[1][1], points[2][0], points[2][1]]
  let vertices = [points[0][0], points[0][1], points[1][0], points[1][1]]
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
  return { buffer: vertexBuffer, vertCount: vertices.length / 2 }
}

export function createLineRenderer(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  points: vec2[],
  resources: Resources,
) {
  const programInfo = initShaderProgram(gl, resources)!
  const vertices = createVertexBuffer(gl, points)
  const projectionMatrix = mat4.create()
  mat4.ortho(projectionMatrix, 0, width, height, 0, -1.0, 1.0)

  const render = function (position: vec2, color: vec4) {
    const modelViewMatrix = mat4.fromTranslation(mat4.create(), [position[0], position[1], 0.0])
    gl.useProgram(programInfo.program)
    setCommonAttributes2D(gl, { position: vertices.buffer! }, programInfo)
    setViewUniformLocations(gl, programInfo, {
      projectionMatrix,
      modelViewMatrix,
      color,
    })
    gl.drawArrays(gl.LINE_STRIP, 0, vertices.vertCount)
  }
  const dispose = () => gl.deleteBuffer(vertices.buffer)
  return { render, dispose }
}
