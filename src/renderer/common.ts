import {Primitives} from "./primitives/primitives";
import {frameColor, frameWidth} from "../constants";

export function setupGl(gl: WebGLRenderingContext) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
}

export function drawFrame(draw2d: Primitives) {
    const sz = draw2d.size()


    draw2d.rect([0,0], [sz.width, frameWidth], frameColor)
    draw2d.rect([0,sz.height-frameWidth], [sz.width, frameWidth], frameColor)
    draw2d.rect([0,0], [frameWidth, sz.height], frameColor)
    draw2d.rect([sz.width-frameWidth,0], [frameWidth, sz.height], frameColor)
}