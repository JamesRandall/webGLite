import { compileShaderProgramFromSource } from "../../shader"
import { mat4, quat, vec2, vec4 } from "gl-matrix"
import { setCommonAttributes2D, setViewUniformLocations } from "../coregl/programInfo"
import { Resources } from "../../resources/resources"
import { disposeRenderingModel } from "../../resources/models"

function initShaderProgram(gl: WebGL2RenderingContext, resources: Resources) {
  const shaderProgram = compileShaderProgramFromSource(gl, resources.shaderSource.uColor)
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

function createVertexBuffer(gl: WebGL2RenderingContext) {
  const vertexBuffer = gl.createBuffer()
  let vertices: number[] = []
  for (let angle = 0; angle <= 360.0; angle++) {
    let radians = (angle * Math.PI) / 180.0
    const vert1 = [Math.sin(radians), Math.cos(radians)]
    const vert2 = [0.0, 0.0]
    vertices = vertices.concat(vert1)
    vertices = vertices.concat(vert2)
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  return { buffer: vertexBuffer, vertCount: vertices.length / 2 }
}

export function createCircleRenderer(gl: WebGL2RenderingContext, width: number, height: number, resources: Resources) {
  const programInfo = initShaderProgram(gl, resources)!
  const vertices = createVertexBuffer(gl)
  const projectionMatrix = mat4.create()
  mat4.ortho(projectionMatrix, 0, width, height, 0, -1.0, 1.0)

  const dispose = () => {
    gl.deleteBuffer(vertices.buffer)
  }

  const render = (position: vec2, radius: number, color: vec4) => {
    const modelViewMatrix = mat4.fromRotationTranslationScale(
      mat4.create(),
      quat.create(),
      [position[0], position[1], 0.0],
      [radius, radius, 1.0],
    )

    gl.useProgram(programInfo.program)
    setCommonAttributes2D(gl, { position: vertices.buffer! }, programInfo)
    setViewUniformLocations(gl, programInfo, {
      projectionMatrix,
      modelViewMatrix,
      color,
    })

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.vertCount)
  }

  return { render, dispose }
}
