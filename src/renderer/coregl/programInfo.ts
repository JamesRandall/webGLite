import { Model } from "../../resources/models"
import { mat4, vec3, vec4 } from "gl-matrix"

// TODO - I did a first pass refactor to pull out the common code. However the data types, as structured, allow
// for error - i.e. you can specify a position buffer without specifiing the attribute location.
// Reworking of the types can resolve this by grouping together optionallity.
// That will be step 2.

// TODO: We need to generalise the initShaderProgram that appears everywhere

interface AttributeBuffers {
  position?: WebGLBuffer
  normals?: WebGLBuffer
  textureCoords?: WebGLBuffer
  color?: WebGLBuffer
}

interface AttributeLocations {
  vertexPosition?: number
  vertexNormal?: number
  textureCoords?: number
  vertexColor?: number
}

export function setCommonAttributes(
  gl: WebGL2RenderingContext,
  buffers: AttributeBuffers,
  programInfo: {
    attribLocations: AttributeLocations
  },
) {
  internalSetCommonAttributes(gl, buffers, programInfo, 3)
}

export function setCommonAttributes2D(
  gl: WebGL2RenderingContext,
  buffers: AttributeBuffers,
  programInfo: {
    attribLocations: AttributeLocations
  },
) {
  internalSetCommonAttributes(gl, buffers, programInfo, 2)
}

function internalSetCommonAttributes(
  gl: WebGL2RenderingContext,
  buffers: AttributeBuffers,
  programInfo: {
    attribLocations: AttributeLocations
  },
  positionBufferComponents: number,
) {
  if (buffers.textureCoords !== undefined && programInfo.attribLocations.textureCoords !== undefined) {
    setTextureAttribute(gl, buffers.textureCoords, programInfo.attribLocations.textureCoords)
  }
  if (buffers.position !== undefined && programInfo.attribLocations.vertexPosition !== undefined) {
    setPositionAttribute(gl, buffers.position, programInfo.attribLocations.vertexPosition, positionBufferComponents)
  }
  if (buffers.normals !== undefined && programInfo.attribLocations.vertexNormal !== undefined) {
    setNormalAttribute(gl, buffers.normals, programInfo.attribLocations.vertexNormal)
  }
  if (buffers.color !== undefined && programInfo.attribLocations.vertexColor !== undefined) {
    setColorAttribute(gl, buffers.color, programInfo.attribLocations.vertexColor)
  }
}

export function setViewUniformLocations(
  gl: WebGL2RenderingContext,
  programInfo: {
    uniformLocations: {
      projectionMatrix?: WebGLUniformLocation
      modelViewMatrix?: WebGLUniformLocation
      normalMatrix?: WebGLUniformLocation
      lightWorldPosition?: WebGLUniformLocation
      shininess?: WebGLUniformLocation
      textureSampler?: WebGLUniformLocation
      texture2Sampler?: WebGLUniformLocation
      color?: WebGLUniformLocation
      time?: WebGLUniformLocation
    }
  },
  uniforms: {
    projectionMatrix?: mat4
    modelViewMatrix?: mat4
    normalMatrix?: mat4
    lightWorldPosition?: vec3
    shininess?: number
    textureIndex?: number
    color?: vec4
    time?: number
  },
  texture?: WebGLTexture,
  texture2?: WebGLTexture,
) {
  if (uniforms.projectionMatrix !== undefined && programInfo.uniformLocations.projectionMatrix !== undefined) {
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, uniforms.projectionMatrix)
  }
  if (uniforms.modelViewMatrix !== undefined && programInfo.uniformLocations.modelViewMatrix !== undefined) {
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, uniforms.modelViewMatrix)
  }
  if (uniforms.normalMatrix !== undefined && programInfo.uniformLocations.normalMatrix !== undefined) {
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, uniforms.normalMatrix)
  }
  if (uniforms.lightWorldPosition !== undefined && programInfo.uniformLocations.lightWorldPosition !== undefined) {
    gl.uniform3fv(programInfo.uniformLocations.lightWorldPosition, uniforms.lightWorldPosition)
  }
  if (uniforms.shininess !== undefined && programInfo.uniformLocations.shininess !== undefined) {
    gl.uniform1f(programInfo.uniformLocations.shininess, uniforms.shininess)
  }
  if (
    uniforms.textureIndex !== undefined &&
    programInfo.uniformLocations.textureSampler !== undefined &&
    texture !== undefined
  ) {
    gl.activeTexture(getGLTexture(gl, uniforms.textureIndex))
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.uniform1i(programInfo.uniformLocations.textureSampler, uniforms.textureIndex)
  }
  if (
    uniforms.textureIndex !== undefined &&
    programInfo.uniformLocations.texture2Sampler !== undefined &&
    texture2 !== undefined
  ) {
    gl.activeTexture(getGLTexture(gl, uniforms.textureIndex + 1))
    gl.bindTexture(gl.TEXTURE_2D, texture2)
    gl.uniform1i(programInfo.uniformLocations.texture2Sampler, uniforms.textureIndex + 1)
  }
  if (uniforms.color !== undefined && programInfo.uniformLocations.color !== undefined) {
    gl.uniform4fv(programInfo.uniformLocations.color, uniforms.color)
  }
  if (uniforms.time !== undefined && programInfo.uniformLocations.time !== undefined) {
    gl.uniform1f(programInfo.uniformLocations.time, uniforms.time)
  }
}

function setNormalAttribute(gl: WebGL2RenderingContext, normalsBuffer: WebGLBuffer, vertexNormal: number) {
  const numComponents = 3
  const type = gl.FLOAT
  const normalize = false
  const stride = 0
  const offset = 0
  gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer)
  gl.vertexAttribPointer(vertexNormal, numComponents, type, normalize, stride, offset)
  gl.enableVertexAttribArray(vertexNormal)
}

function setColorAttribute(gl: WebGL2RenderingContext, colorsBuffer: WebGLBuffer, vertexColor: number) {
  const numComponents = 4
  const type = gl.FLOAT
  const normalize = false
  const stride = 0
  const offset = 0
  gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer)
  gl.vertexAttribPointer(vertexColor, numComponents, type, normalize, stride, offset)
  gl.enableVertexAttribArray(vertexColor)
}

function setPositionAttribute(
  gl: WebGL2RenderingContext,
  vertexBuffer: WebGLBuffer,
  vertexPosition: number,
  numComponents: number,
) {
  const type = gl.FLOAT // the data in the buffer is 32bit floats
  const normalize = false // don't normalize
  const stride = 0 // how many bytes to get from one set of values to the next
  // 0 = use type and numComponents above
  const offset = 0 // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.vertexAttribPointer(vertexPosition, numComponents, type, normalize, stride, offset)
  gl.enableVertexAttribArray(vertexPosition)
}

function setTextureAttribute(
  gl: WebGL2RenderingContext,
  textureCoordsBuffer: WebGLBuffer,
  textureCoordsPosition: number,
) {
  const num = 2 // every coordinate composed of 2 values
  const type = gl.FLOAT // the data in the buffer is 32-bit float
  const normalize = false // don't normalize
  const stride = 0 // how many bytes to get from one set to the next
  const offset = 0 // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordsBuffer)
  gl.vertexAttribPointer(textureCoordsPosition, num, type, normalize, stride, offset)
  gl.enableVertexAttribArray(textureCoordsPosition)
}

function getGLTexture(gl: WebGL2RenderingContext, index: number) {
  return index == 0
    ? gl.TEXTURE0
    : index == 1
      ? gl.TEXTURE1
      : index == 2
        ? gl.TEXTURE2
        : index == 3
          ? gl.TEXTURE3
          : index == 4
            ? gl.TEXTURE4
            : index == 5
              ? gl.TEXTURE5
              : gl.TEXTURE0
}
