import {compileShaderProgram} from "../../shader";
import {createSquareModelWithTexture} from "../../resources/models";
import {mat4, quat, vec2, vec4} from "gl-matrix";
import {setCommonAttributes2D, setViewUniformLocations} from "../coregl/programInfo";

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
out vec4 outputColor;

void main(void) {
    outputColor = uColor;
}
`

function initShaderProgram(gl:WebGLRenderingContext)  {
    const shaderProgram = compileShaderProgram(gl, vsSource, fsSource)
    if (!shaderProgram) { return null }

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

function createVertexBuffer(gl:WebGLRenderingContext) {
    const vertexBuffer = gl.createBuffer()
    let vertices = [
        0, 0,
        1, 0,
        1, 1,

        1, 1,
        0, 1,
        0, 0
    ].map(p => p)

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

    return { buffer: vertexBuffer, vertCount: vertices.length/2 }
}

export function createRectRenderer(gl:WebGLRenderingContext) {
    const programInfo = initShaderProgram(gl)!
    const vertices = createVertexBuffer(gl)
    const projectionMatrix = mat4.create()
    mat4.ortho(projectionMatrix, 0, gl.canvas.width, gl.canvas.height, 0, -1.0, 1.0)

    return function (position: vec2, size: vec2, color: vec4) {

        const modelViewMatrix = mat4.fromRotationTranslationScale(mat4.create(), quat.create(), [position[0], position[1],0.0], [size[0], size[1], 1.0])

        gl.useProgram(programInfo.program)
        setCommonAttributes2D(gl, { position: vertices.buffer!}, programInfo)
        setViewUniformLocations(gl, programInfo, {
            projectionMatrix,
            modelViewMatrix,
            color
        })
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.vertCount)
    }
}