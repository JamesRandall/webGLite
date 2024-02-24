import { RendererFunc } from "../scenes/scene"
import { bindBufferAndSetViewport, createFrameBufferTexture, drawFrame, setupGl } from "./common"
import { dimensions } from "../constants"
import { Game } from "../model/game"
import { createPrimitiveRenderer } from "./primitives/primitives"
import { Resources, ShaderSource } from "../resources/resources"
import { compileShaderProgram2 } from "../shader"
import { createSquareModel } from "../resources/models"
import { mat4, quat, vec2 } from "gl-matrix"
import { setCommonAttributes, setViewUniformLocations } from "./coregl/programInfo"

export enum RenderEffect {
  None,
  CRT,
  AmberCRT,
  GreenCRT,
  VCR,
}

const globalRenderEffects = [
  RenderEffect.None,
  RenderEffect.CRT,
  RenderEffect.AmberCRT,
  RenderEffect.GreenCRT,
  RenderEffect.VCR,
]

export function nextEffect(currentEffect: RenderEffect) {
  const index = globalRenderEffects.indexOf(currentEffect)
  if (index + 1 >= globalRenderEffects.length) {
    return globalRenderEffects[0]
  }
  return globalRenderEffects[index + 1]
}

export function previousEffect(currentEffect: RenderEffect) {
  const index = globalRenderEffects.indexOf(currentEffect)
  if (index - 1 < 0) {
    return globalRenderEffects[globalRenderEffects.length - 1]
  }
  return globalRenderEffects[index - 1]
}

function initShaderProgram(gl: WebGL2RenderingContext, shaderSource: ShaderSource) {
  const shaderProgram = compileShaderProgram2(gl, shaderSource)
  if (!shaderProgram) {
    return null
  }

  return {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      textureCoords: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!,
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!,
      textureSampler: gl.getUniformLocation(shaderProgram, "uSampler")!,
      texture2Sampler: gl.getUniformLocation(shaderProgram, "uNoise")!,
      resolution: gl.getUniformLocation(shaderProgram, "iResolution")!,
      time: gl.getUniformLocation(shaderProgram, "iTime")!,
    },
  }
}

function createRenderer(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  source: ShaderSource,
  noise: WebGLTexture,
) {
  const programInfo = initShaderProgram(gl, source)!
  const square = createSquareModel(gl, [1.0, 0.0, 0.0, 1.0], null, true)
  const projectionMatrix = mat4.create()
  mat4.ortho(projectionMatrix, 0, width, height, 0, -1.0, 1.0)
  const resolution = vec2.fromValues(width, height)

  return function (position: vec2, size: vec2, texture: WebGLTexture, time: number) {
    // the divide by two is because the model has extents of -1.0 to 1.0
    const modelViewMatrix = mat4.fromRotationTranslationScale(
      mat4.create(),
      quat.create(),
      [position[0] + size[0] / 2, position[1] + size[1] / 2, 0.0],
      [size[0] / 2, size[1] / 2, 1.0],
    )

    gl.useProgram(programInfo.program)
    setCommonAttributes(gl, square, programInfo)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, square.indices)
    setViewUniformLocations(
      gl,
      programInfo,
      {
        projectionMatrix,
        modelViewMatrix,
        textureIndex: 0,
        time,
      },
      texture,
      noise,
    )
    gl.uniform2fv(programInfo.uniformLocations.resolution, resolution)

    const vertexCount = square.vertexCount
    const type = gl.UNSIGNED_SHORT
    const offset = 0
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
  }
}

function createFrameBuffer(gl: WebGL2RenderingContext, width: number, height: number) {
  const frameBufferTexture = createFrameBufferTexture(gl, width, height)!
  const frameBuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frameBufferTexture, 0)
  const depthBuffer = gl.createRenderbuffer()
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer)
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT32F, width, height)
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer)
  return [frameBuffer!, frameBufferTexture!]
}

export function createRootRenderer(
  gl: WebGL2RenderingContext,
  resources: Resources,
  sceneRenderer: RendererFunc,
  dashboardRenderer: RendererFunc,
) {
  console.log(dimensions)
  // This sets up a frame buffer that will render to a texture and attaches a depth buffer to it
  const [frameBuffer, frameBufferTexture] = createFrameBuffer(gl, dimensions.width, dimensions.totalHeight)
  const [flightSceneFrameBuffer, flightSceneFrameBufferTexture] = createFrameBuffer(
    gl,
    dimensions.width,
    dimensions.mainViewHeight,
  )

  //const flightSceneFrameBufferTexture = createFrameBufferTexture(gl, dimensions.width, dimensions.mainViewHeight)
  //const flightSceneFrameBuffer = gl.createFramebuffer()

  const createGlobalRenderEffect = (src: ShaderSource) =>
    createRenderer(gl, dimensions.width, dimensions.totalHeight, src, resources.textures.noise)
  const createFlightSceneRenderEffect = (src: ShaderSource) =>
    createRenderer(gl, dimensions.width, dimensions.mainViewHeight, src, resources.textures.noise)

  var globalEffects = new Map([
    [RenderEffect.None, createGlobalRenderEffect(resources.shaderSource.simpleTexture)],
    [RenderEffect.CRT, createGlobalRenderEffect(resources.shaderSource.crt)],
    [RenderEffect.AmberCRT, createGlobalRenderEffect(resources.shaderSource.amberCrt)],
    [RenderEffect.GreenCRT, createGlobalRenderEffect(resources.shaderSource.greenCrt)],
    [RenderEffect.VCR, createGlobalRenderEffect(resources.shaderSource.vcr)],
  ])
  let time = 0.0
  const flightSceneMotionBlur = createFlightSceneRenderEffect(resources.shaderSource.motionBlur)
  const flightSceneCopy = createFlightSceneRenderEffect(resources.shaderSource.simpleTexture)

  const draw2d = createPrimitiveRenderer(gl, false, resources, dimensions.width, dimensions.mainViewHeight)

  const applyFlightSceneMotionBlur = (effectTime: number) =>
    flightSceneMotionBlur(
      [0, 0],
      [dimensions.width, dimensions.mainViewHeight],
      flightSceneFrameBufferTexture,
      effectTime,
    )
  const applyFlightSceneCopy = (effectTime: number) =>
    flightSceneCopy([0, 0], [dimensions.width, dimensions.mainViewHeight], flightSceneFrameBufferTexture, effectTime)

  return (game: Game, timeDelta: number, effect: RenderEffect) => {
    time += timeDelta
    // First draw our flight scene to a texture so that we can apply post processing effects to it
    bindBufferAndSetViewport(gl, flightSceneFrameBuffer, dimensions.width, dimensions.mainViewHeight)
    setupGl(gl)
    sceneRenderer(game, timeDelta)

    // Now select the frame buffer pointing at a texture that represents our composed scene (flight scene + dashboard)
    // and draw the texture from the flight scene, using the appropriate effect, along with the dashboard (no effect)
    bindBufferAndSetViewport(
      gl,
      frameBuffer,
      dimensions.width,
      dimensions.mainViewHeight,
      0,
      dimensions.dashboardHeight,
    )
    setupGl(gl)
    if (game.player.isJumping) {
      applyFlightSceneMotionBlur(time)
    } else {
      applyFlightSceneCopy(time)
    }
    drawFrame(draw2d)

    // draw the dashboard
    gl.viewport(0, 0, dimensions.width, dimensions.dashboardHeight)
    dashboardRenderer(game, timeDelta)

    // finally target the output buffer and render our texture applying a whole screen post processing effect if
    // required
    bindBufferAndSetViewport(gl, null, dimensions.width, dimensions.totalHeight)
    globalEffects.get(effect)!([0, 0], [dimensions.width, dimensions.totalHeight], frameBufferTexture, time)
  }
}
