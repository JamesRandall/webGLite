import {Model} from "../../resources/models";
import {mat4, vec3} from "gl-matrix";

export function setCommonAttributes(
    gl:WebGLRenderingContext,
    buffers:{
        position?: WebGLBuffer,
        normals?: WebGLBuffer,
        textureCoords?: WebGLBuffer
        color?: WebGLBuffer
    },
    programInfo:{
        attribLocations: {
            vertexPosition?: number,
            vertexNormal?: number,
            textureCoords?: number,
            vertexColor?: number
        }
    }) {
    if (buffers.textureCoords !== undefined && programInfo.attribLocations.textureCoords !== undefined) {
        setTextureAttribute(gl, buffers.textureCoords, programInfo.attribLocations.textureCoords)
    }
    if (buffers.position !== undefined && programInfo.attribLocations.vertexPosition !== undefined) {
        setPositionAttribute(gl, buffers.position, programInfo.attribLocations.vertexPosition)
    }
    if (buffers.normals !== undefined && programInfo.attribLocations.vertexNormal !== undefined) {
        setNormalAttribute(gl, buffers.normals, programInfo.attribLocations.vertexNormal)
    }
    if (buffers.color !== undefined && programInfo.attribLocations.vertexColor !== undefined) {
        setColorAttribute(gl, buffers.color, programInfo.attribLocations.vertexColor)
    }
}

function setNormalAttribute(gl:WebGLRenderingContext, normalsBuffer:WebGLBuffer, vertexNormal:number) {
    const numComponents = 3
    const type = gl.FLOAT
    const normalize = false
    const stride = 0
    const offset = 0
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer)
    gl.vertexAttribPointer(
        vertexNormal,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(vertexNormal)
}

function setColorAttribute(gl:WebGLRenderingContext, colorsBuffer:WebGLBuffer, vertexColor:number) {
    const numComponents = 4
    const type = gl.FLOAT
    const normalize = false
    const stride = 0
    const offset = 0
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer)
    gl.vertexAttribPointer(
        vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    )
    gl.enableVertexAttribArray(vertexColor)
}

function setPositionAttribute(gl:WebGLRenderingContext, vertexBuffer: WebGLBuffer, vertexPosition:number) {
    const numComponents = 3; // pull out 2 values per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.vertexAttribPointer(
        vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(vertexPosition);
}

function setTextureAttribute(
    gl:WebGLRenderingContext,
    textureCoordsBuffer: WebGLBuffer,
    textureCoordsPosition:number) {

    const num = 2 // every coordinate composed of 2 values
    const type = gl.FLOAT // the data in the buffer is 32-bit float
    const normalize = false // don't normalize
    const stride = 0 // how many bytes to get from one set to the next
    const offset = 0 // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordsBuffer)
    gl.vertexAttribPointer(
        textureCoordsPosition,
        num,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(textureCoordsPosition);
}

export function setViewUniformLocations(
    gl:WebGLRenderingContext,
    programInfo:{
        uniformLocations: {
            projectionMatrix?: WebGLUniformLocation,
            modelViewMatrix?: WebGLUniformLocation,
            normalMatrix?: WebGLUniformLocation,
            lightWorldPosition?: WebGLUniformLocation,
            shininess?: WebGLUniformLocation,
            textureSampler?: WebGLUniformLocation
        }
    },
    uniforms: {
        projectionMatrix?: mat4,
        modelViewMatrix?: mat4,
        normalMatrix?: mat4,
        lightWorldPosition?: vec3,
        shininess?: number,
        textureIndex?: number
    },
    texture?: WebGLTexture
) {
    if (uniforms.projectionMatrix !== undefined && programInfo.uniformLocations.projectionMatrix !== undefined) {
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            uniforms.projectionMatrix,
        )
    }
    if (uniforms.modelViewMatrix !== undefined && programInfo.uniformLocations.modelViewMatrix !== undefined) {
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            uniforms.modelViewMatrix,
        )
    }
    if (uniforms.normalMatrix !== undefined && programInfo.uniformLocations.normalMatrix !== undefined) {
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.normalMatrix,
            false,
            uniforms.normalMatrix,
        )
    }
    if (uniforms.lightWorldPosition !== undefined && programInfo.uniformLocations.lightWorldPosition !== undefined) {
        gl.uniform3fv(programInfo.uniformLocations.lightWorldPosition, uniforms.lightWorldPosition)
    }
    if (uniforms.shininess !== undefined && programInfo.uniformLocations.shininess !== undefined) {
        gl.uniform1f(programInfo.uniformLocations.shininess,uniforms.shininess)
    }
    if (uniforms.textureIndex !== undefined && programInfo.uniformLocations.textureSampler !== undefined && texture !== undefined) {
        gl.activeTexture(getGLTexture(gl, uniforms.textureIndex))
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.uniform1i(programInfo.uniformLocations.textureSampler, uniforms.textureIndex)
    }
}

function getGLTexture(gl: WebGLRenderingContext, index: number) {
    return index == 0
        ? gl.TEXTURE0
        : index == 1 ? gl.TEXTURE1
        : index == 2 ? gl.TEXTURE2
        : index == 3 ? gl.TEXTURE3
        : index == 4 ? gl.TEXTURE4
        : index == 5 ? gl.TEXTURE5
        : gl.TEXTURE0
}
