import {createRectRenderer} from "./rectangle";
import {createCircleRenderer} from "./circle";
import {createTextRenderer} from "./text";
import {vec2, vec4} from "gl-matrix";
import {Size} from "../../model/geometry";

export interface Primitives {
    rect: (position: vec2, size: vec2, color: vec4) => void
    circle: (position: vec2, radius: number, color: vec4) => void
    text: {
        draw: (text: string, position: vec2, useCharacterSpace?: boolean) => void
        measure: (text: string) => Size
        convertToCharacterCoordinates: (position: vec2) => vec2
        convertToPosition: (characterPosition: vec2) => vec2
        drawAtSize: (text: string, position: vec2, cw: number, ch: number, spacing: number, color:vec4) => void
    }
    size: () => Size
}

export function createPrimitiveRenderer(gl: WebGLRenderingContext, flippedY: boolean = false) : Primitives {
    return {
        rect: createRectRenderer(gl),
        circle: createCircleRenderer(gl),
        text: createTextRenderer(gl, flippedY),
        size: () => ({width: gl.canvas.width, height: gl.canvas.height})
    }
}