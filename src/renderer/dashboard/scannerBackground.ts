import {compileShaderProgram} from "../../shader";
import {createSquareModelWithTexture, Model} from "../../resources/models";
import {mat4, quat, vec3} from "gl-matrix";

const vsSource = `#version 300 es
    precision highp float;
    in vec4 aVertexPosition;
    in vec2 aTextureCoord;
    
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    out highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
    }
  `
const fsSource = `#version 300 es
precision highp float;
in highp vec2 vTextureCoord;

uniform sampler2D uSampler;

out lowp vec4 outputColor;

void main(void) {
    outputColor = texture(uSampler, vTextureCoord);
}
`

interface ProgramInfo {
    program: WebGLProgram
    attribLocations: {
        vertexPosition: number
        textureCoords: number
    },
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation
        modelViewMatrix: WebGLUniformLocation
        sampler: WebGLUniformLocation
    }
}

function initShaderProgram(gl:WebGLRenderingContext) : ProgramInfo | null {
    const shaderProgram = compileShaderProgram(gl, vsSource, fsSource)
    if (!shaderProgram) { return null }

    return {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            textureCoords: gl.getAttribLocation(shaderProgram, "aTextureCoord")
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!,
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!,
            sampler: gl.getUniformLocation(shaderProgram, "uSampler")!
        },
    }
}

function setTextureAttribute(gl:WebGLRenderingContext, buffers:Model, programInfo:ProgramInfo) {
    const num = 2 // every coordinate composed of 2 values
    const type = gl.FLOAT // the data in the buffer is 32-bit float
    const normalize = false // don't normalize
    const stride = 0 // how many bytes to get from one set to the next
    const offset = 0 // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoords)
    gl.vertexAttribPointer(
        programInfo.attribLocations.textureCoords,
        num,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoords);
}

function setPositionAttribute(gl:WebGLRenderingContext, buffers:Model, programInfo:ProgramInfo) {
    const numComponents = 3; // pull out 2 values per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

export function createScannerBackgroundRenderer(gl:WebGLRenderingContext, projectionMatrix:mat4, scale:vec3) {
    const programInfo = initShaderProgram(gl)!
    const model = createSquareModelWithTexture(gl, "./scanner.png", true, false, true)

    const rotate = quat.rotateX(quat.create(), quat.create(), -90 * (Math.PI/180))
    const position = vec3.fromValues(0,0,0)
    const modelViewMatrix = mat4.fromRotationTranslationScale(
        mat4.create(),
        rotate,
        position,
        scale)

    return function() {
        gl.useProgram(programInfo.program);
        setPositionAttribute(gl, model, programInfo)
        setTextureAttribute(gl,model,programInfo)
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix,
        )
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix,
        )
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, model.texture)
        gl.uniform1i(programInfo.uniformLocations.sampler, 0)

        {
            const vertexCount = model.vertexCount;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
    }
}