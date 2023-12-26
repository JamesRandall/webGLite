/*

import {mat4} from "gl-matrix";
import {ProgramInfo, setColorAttribute, setNormalAttribute, setPositionAttribute} from "./shader";
import {loadModel} from "./resources/models";

let then = 0;
let cubeRotation = 0.0
let deltaTime = 0

export async function setupScene(gl: WebGLRenderingContext, programInfo: ProgramInfo) {
    const buffers = await loadModel(gl, "ships/cobramk3.obj",0.2)
    const shipDistance = 40.0

    return (now:number) => drawScene(gl, programInfo, buffers, shipDistance,now)
}

function drawScene(gl:WebGLRenderingContext, programInfo:ProgramInfo, buffers:any, distance:number, now: number) {
    now *= 0.001; // convert to seconds
    deltaTime = now - then;
    then = now;

    gl.clearColor(0.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
    gl.clearDepth(1.0) // Clear everything
    gl.enable(gl.DEPTH_TEST) // Enable depth testing
    gl.depthFunc(gl.LEQUAL) // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const canvas = gl.canvas as HTMLCanvasElement
    const fieldOfView = (45 * Math.PI) / 180 // in radians
    const aspect = canvas.clientWidth / canvas.clientHeight
    const zNear = 0.1
    const zFar = 512.0
    const projectionMatrix = mat4.create()

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.create()

    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    mat4.translate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to translate
        [-0.0, 0.0, -distance],
    ) // amount to translate

    mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        cubeRotation, // amount to rotate in radians
        [0, 0, 1],
    ); // axis to rotate around (Z)
    mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        cubeRotation * 0.7, // amount to rotate in radians
        [0, 1, 0],
    ) // axis to rotate around (Y)
    mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        cubeRotation * 0.3, // amount to rotate in radians
        [1, 0, 0],
    ) // axis to rotate around (X)

    const normalMatrix = mat4.create()
    mat4.invert(normalMatrix, modelViewMatrix)
    mat4.transpose(normalMatrix, normalMatrix)

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    setPositionAttribute(gl, buffers, programInfo)
    setColorAttribute(gl, buffers, programInfo)
    setNormalAttribute(gl, buffers, programInfo)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    // Set the shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix,
    )
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix,
    )
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.normalMatrix,
        false,
        normalMatrix,
    )

    {
        const vertexCount = buffers.vertexCount;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }

    cubeRotation += deltaTime;
}
*/
