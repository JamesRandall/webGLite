import {RendererFunc} from "./scene";
import {bindBufferAndSetViewport, createFrameBufferTexture, setupGl} from "../renderer/common";
import {dimensions} from "../constants";
import {Game} from "../model/game";
import {createPrimitiveRenderer} from "../renderer/primitives/primitives";
import {Resources} from "../resources/resources";

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

    const draw2d = createPrimitiveRenderer(gl, false, resources, viewportWidth, viewportHeight)

    return (game:Game, timeDelta:number) => {
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
        draw2d.texturedRect([0,0], [viewportWidth, viewportHeight], frameBufferTexture)
    }
}