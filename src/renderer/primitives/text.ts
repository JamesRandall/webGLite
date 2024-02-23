// Our font strip contains characters that are 8 pixels wide and 16 pixels high.
// Each character is positioned at a 16 offset (character 0 - x = 0, character 1 x = 16, character 2 x = 32 etc.)
// There are 96 characters in the strip

import { compileShaderProgram, compileShaderProgram2 } from "../../shader"
import { createSquareModelWithLoadedTexture } from "../../resources/models"
import { LocalBubble } from "../../model/localBubble"
import { mat4, quat, vec2, vec3, vec4 } from "gl-matrix"
import { setCommonAttributes, setCommonAttributes2D, setViewUniformLocations } from "../coregl/programInfo"
import { Resources } from "../../resources/resources"

function initShaderProgram(gl: WebGL2RenderingContext, resources: Resources) {
  const shaderProgram = compileShaderProgram2(gl, resources.shaderSource.text)
  if (!shaderProgram) {
    return null
  }

  return {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
      textureCoords: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!,
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!,
      characterOffset: gl.getUniformLocation(shaderProgram, "uCharacterOffset")!,
      textureSampler: gl.getUniformLocation(shaderProgram, "uSampler")!,
      color: gl.getUniformLocation(shaderProgram, "uColor")!,
    },
  }
}

function getFontSize(width: number, height: number, characterWidth?: number) {
  if (characterWidth === undefined) {
    const characterHeight = height / 23.0
    //characterWidth = width / 40.0
    return [characterHeight / 1.2, characterHeight]
  }
  return [characterWidth, characterWidth * 1.2]
}

export function createTextRenderer(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  flippedY: boolean,
  resources: Resources,
  optionalCharacterWidth?: number,
  font?: WebGLTexture,
) {
  const programInfo = initShaderProgram(gl, resources)!
  const square = createSquareModelWithLoadedTexture(
    gl,
    font !== undefined ? font : resources.textures.font,
    flippedY,
    true,
  )
  const projectionMatrix = mat4.create()
  mat4.ortho(projectionMatrix, 0, width, height, 0, -1.0, 1.0)
  const [characterWidth, characterHeight] = getFontSize(width, height, optionalCharacterWidth)
  const spacing = 1.0
  const yMultiplier = flippedY ? -1 : 1

  const convertToPosition = (characterPosition: vec2) =>
    vec2.fromValues(characterPosition[0] * (characterWidth! + spacing), characterPosition[1] * characterHeight)

  const convertToCharacterCoordinates = (position: vec2) =>
    vec2.fromValues(Math.floor(position[0] / (characterWidth! + spacing)), Math.floor(position[1] / characterHeight))
  const measure = (text: string) => {
    return { width: (characterWidth! + spacing) * text.length, height: characterHeight }
  }
  const draw = (
    text: string,
    position: vec2,
    useCharacterSpace: boolean = true,
    color: vec4 = vec4.fromValues(1.0, 1.0, 1.0, 1.0),
  ) => {
    gl.useProgram(programInfo.program)

    // Set the shader uniforms
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix)

    let displayPosition = useCharacterSpace
      ? vec3.fromValues(position[0] * (characterWidth! + spacing), position[1] * characterHeight, 1.0)
      : vec3.fromValues(position[0], position[1], 0.0)
    drawCharacters(text, displayPosition, characterWidth!, characterHeight, color, spacing)
  }

  function drawCharacters(
    text: string,
    displayPosition: vec3,
    cw: number,
    ch: number,
    color: [number, number, number, number] | Float32Array,
    spacing: number,
  ) {
    Array.from(text).forEach((c) => {
      const modelViewMatrix = mat4.fromRotationTranslationScale(mat4.create(), quat.create(), displayPosition, [
        cw / 2,
        (ch / 2) * yMultiplier,
        1.0,
      ])
      setCommonAttributes(gl, square, programInfo)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, square.indices)
      setViewUniformLocations(
        gl,
        programInfo,
        {
          modelViewMatrix,
          color,
          textureIndex: 0,
        },
        square.texture!,
      )
      gl.uniform1f(programInfo.uniformLocations.characterOffset, c.charCodeAt(0) - 32)

      {
        const vertexCount = square.vertexCount
        const type = gl.UNSIGNED_SHORT
        const offset = 0
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
      }

      displayPosition[0] += cw + spacing
    })
  }

  const drawAtSize = (text: string, position: vec2, cw: number, ch: number, spacing: number, color: vec4) => {
    if (ch <= 0) {
      ch = cw * 1.2
    }

    gl.useProgram(programInfo.program)

    // Set the shader uniforms
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix)

    let displayPosition = vec3.fromValues(position[0], position[1], 0.0)
    drawCharacters(text, displayPosition, cw, ch, color, spacing)
  }

  const center = (text: string, row: number, color: vec4 = vec4.fromValues(1.0, 1.0, 1.0, 1.0)) => {
    const sz = measure(text)
    draw(text, [width / 2 - sz.width / 2, row * characterHeight], false)
  }

  return {
    convertToPosition,
    convertToCharacterCoordinates,
    draw,
    measure,
    drawAtSize,
    center,
    fontSize: { width: characterWidth, height: characterHeight },
  }
}
