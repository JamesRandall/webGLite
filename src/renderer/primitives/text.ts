// Our font strip contains characters that are 8 pixels wide and 16 pixels high.
// Each character is positioned at a 16 offset (character 0 - x = 0, character 1 x = 16, character 2 x = 32 etc.)
// There are 96 characters in the strip

import {compileShaderProgram} from "../../shader";
import {createSquareModelWithTexture} from "../../resources/models";
import {LocalBubble} from "../../model/localBubble";
import {mat4, quat, vec2, vec3, vec4} from "gl-matrix";
import {setCommonAttributes, setCommonAttributes2D, setViewUniformLocations} from "../coregl/programInfo";

const vsSource = `#version 300 es
    precision highp float;
    in vec4 aVertexPosition;
    in vec4 aVertexColor;
    in vec2 aTextureCoord;
    
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform float uCharacterOffset;

    out lowp vec4 vColor;
    out highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
      // pick out the character from the texture set
      float characterSpacing = 1.0 / 96.0; // 96 characters in the strip
      float characterSize = (1.0 / 1536.0) * 7.0;
      vTextureCoord = vec2((characterSpacing * uCharacterOffset) + aTextureCoord.x * characterSize, aTextureCoord.y);
    }
  `
const fsSource = `#version 300 es
precision highp float;
in lowp vec4 vColor;
in highp vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec4 uColor;

out lowp vec4 outputColor;

void main(void) {
    vec4 tex = texture(uSampler, vTextureCoord);
    if (tex.r > 0.0 || tex.g > 0.0 || tex.b > 0.0) {
        outputColor = uColor;
    } 
    else {
        outputColor = vec4(0.0,0.0,0.0,0.0);
    }
}
`


function initShaderProgram(gl:WebGLRenderingContext) {
    const shaderProgram = compileShaderProgram(gl, vsSource, fsSource)
    if (!shaderProgram) { return null }

    return {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
            textureCoords: gl.getAttribLocation(shaderProgram, "aTextureCoord")
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!,
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!,
            characterOffset: gl.getUniformLocation(shaderProgram, "uCharacterOffset")!,
            textureSampler: gl.getUniformLocation(shaderProgram, "uSampler")!,
            color: gl.getUniformLocation(shaderProgram, "uColor")!
        },
    }
}

export function createTextRenderer(gl:WebGLRenderingContext, flippedY:boolean) {
    const programInfo = initShaderProgram(gl)!
    const square = createSquareModelWithTexture(gl, "/font.png", false, true)
    const projectionMatrix = mat4.create()
    mat4.ortho(projectionMatrix, 0, gl.canvas.width, gl.canvas.height, 0, -1.0, 1.0)
    const characterWidth = gl.canvas.width / 40.0
    const characterHeight = characterWidth * 1.2
    const spacing = 1.0
    const yMultiplier = flippedY ? -1 : 1

    const convertToPosition = (characterPosition: vec2) =>
        vec2.fromValues(
            characterPosition[0] * (characterWidth + spacing),
            characterPosition[1] * characterHeight
        )

    const convertToCharacterCoordinates = (position: vec2) =>
        vec2.fromValues(
            Math.floor(position[0] / (characterWidth + spacing)),
            Math.floor(position[1] / characterHeight)
        )
    const measure = (text:string) => {
        return { width: (characterWidth + spacing) * text.length, height: characterHeight }
    }
    const draw = (text: string, position: vec2, useCharacterSpace:boolean = true) => {
        gl.useProgram(programInfo.program);

        // Set the shader uniforms
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix,
        )

        let displayPosition = useCharacterSpace
            ? vec3.fromValues(position[0]*(characterWidth+spacing), position[1]*characterHeight, 1.0)
            : vec3.fromValues(position[0],position[1],0.0)
        const color = vec4.fromValues(1.0,1.0,1.0,1.0)
        drawCharacters(text, displayPosition, characterWidth, characterHeight, color, spacing);
    }

    function drawCharacters(text: string, displayPosition: vec3, cw: number, ch: number, color: [number, number, number, number] | Float32Array, spacing: number) {
        Array.from(text).forEach(c => {
            const modelViewMatrix = mat4.fromRotationTranslationScale(mat4.create(), quat.create(), displayPosition, [cw / 2, (ch / 2) * yMultiplier, 1.0])
            setCommonAttributes(gl, square, programInfo)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, square.indices)
            setViewUniformLocations(gl, programInfo, {
                modelViewMatrix,
                color,
                textureIndex: 0
            },
                square.texture!)
            gl.uniform1f(
                programInfo.uniformLocations.characterOffset,
                c.charCodeAt(0) - 32
            )

            {
                const vertexCount = square.vertexCount
                const type = gl.UNSIGNED_SHORT
                const offset = 0
                gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
            }

            displayPosition[0] += cw + spacing
        })
    }

    const drawAtSize = (text: string, position: vec2, cw: number, ch:number, spacing:number, color: vec4) => {
        if (ch <= 0) { ch = cw * 1.2 }

        gl.useProgram(programInfo.program);

        // Set the shader uniforms
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix,
        )

        let displayPosition = vec3.fromValues(position[0],position[1],0.0)
        drawCharacters(text, displayPosition, cw, ch, color, spacing);
    }

    return { convertToPosition, convertToCharacterCoordinates, draw, measure, drawAtSize }
}