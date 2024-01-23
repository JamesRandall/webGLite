import {RendererFunc} from "./scene";
import {bindBufferAndSetViewport, createFrameBufferTexture, setupGl} from "../renderer/common";
import {dimensions} from "../constants";
import {Game} from "../model/game";
import {createPrimitiveRenderer} from "../renderer/primitives/primitives";
import {Resources, ShaderSource} from "../resources/resources";
import {compileShaderProgram2} from "../shader";
import {createSquareModel} from "../resources/models";
import {mat4, quat, vec2} from "gl-matrix";
import {setCommonAttributes, setViewUniformLocations} from "../renderer/coregl/programInfo";

export enum RenderEffect {
    None,
    CRT
}

function initShaderProgram(gl:WebGLRenderingContext, shaderSource:ShaderSource)  {
    const shaderProgram = compileShaderProgram2(gl, shaderSource)
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
            textureSampler: gl.getUniformLocation(shaderProgram, "uSampler")!,
            resolution: gl.getUniformLocation(shaderProgram, "iResolution")!,
            time: gl.getUniformLocation(shaderProgram, "iTime")!,
        },
    }
}

function createRenderer(gl:WebGLRenderingContext, width:number, height: number, source: ShaderSource) {
    const programInfo = initShaderProgram(gl, source)!
    const square = createSquareModel(gl, [1.0,0.0,0.0,1.0], null, true)
    const projectionMatrix = mat4.create()
    mat4.ortho(projectionMatrix, 0, width, height, 0, -1.0, 1.0)
    const resolution = vec2.fromValues(width, height)


    return function (position: vec2, size: vec2, texture: WebGLTexture, time: number) {
        // the divide by two is because the model has extents of -1.0 to 1.0
        const modelViewMatrix = mat4.fromRotationTranslationScale(mat4.create(), quat.create(), [position[0]+size[0]/2, position[1]+size[1]/2,0.0], [size[0]/2, size[1]/2, 1.0])

        gl.useProgram(programInfo.program)
        setCommonAttributes(gl, square, programInfo)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, square.indices)
        setViewUniformLocations(gl, programInfo, {
                projectionMatrix,
                modelViewMatrix,
                textureIndex: 0
            },
            texture)
        gl.uniform2fv(programInfo.uniformLocations.resolution, resolution)

        const vertexCount = square.vertexCount
        const type = gl.UNSIGNED_SHORT
        const offset = 0
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
    }
}

export function createRootRenderer(
    gl:WebGLRenderingContext,
    resources: Resources,
    sceneRenderer: RendererFunc,
    dashboardRenderer: RendererFunc) {
    // This sets up a frame buffer that will render to a texture and attaches a depth buffer to it
    const viewportWidth = dimensions.width
    const viewportHeight = dimensions.totalHeight
    const frameBufferTexture = createFrameBufferTexture(gl, viewportWidth, viewportHeight)!
    const frameBuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frameBufferTexture, 0)
    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, viewportWidth, viewportHeight);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    var effects = new Map([
        [RenderEffect.None, createRenderer(gl, viewportWidth, viewportHeight, resources.shaderSource.simpleTexture)],
        [RenderEffect.CRT, createRenderer(gl, viewportWidth, viewportHeight, resources.shaderSource.crt)]
    ])
    let time = 0.0

    return (game:Game, timeDelta:number, effect:RenderEffect) => {
        time += timeDelta
        // target the frame buffer and render to our target texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
        gl.viewport(0,dimensions.dashboardHeight,dimensions.width,dimensions.totalHeight)
        setupGl(gl)
        // draw the main scene
        gl.viewport(0,dimensions.dashboardHeight,dimensions.width,dimensions.mainViewHeight)
        sceneRenderer(game, timeDelta)
        // draw the dashboard
        gl.viewport(0,0,dimensions.width,dimensions.dashboardHeight)
        dashboardRenderer(game, timeDelta)

        // target the output buffer and render our texture
        // (this is where we will apply a post-processing effect)
        bindBufferAndSetViewport(gl, null, viewportWidth, viewportHeight)
        effects.get(effect)!([0,0], [viewportWidth, viewportHeight], frameBufferTexture, time)
        //draw2d.texturedRect([0,0], [viewportWidth, viewportHeight], frameBufferTexture)
    }
}