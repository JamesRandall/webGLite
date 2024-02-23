import { createGameScene } from "./scenes/gameScene"
import { loadResources } from "./resources/resources"
import { createPregameScene } from "./scenes/pregameScene"
import { RenderEffect } from "./renderer/rootRenderer"
import { createInstructionRenderer } from "./renderer/instructions/renderInstructions"
import { createStartingScene, StartingSceneEnum } from "./scenes/sceneFactory"
import { setDimensions } from "./constants"

require("./extensions.ts")

async function mount(viewCanvas: HTMLCanvasElement, docCanvas: HTMLCanvasElement) {
  const retroRatio = 800 / 760
  const wideScreenRatio = 16 / 9

  const urlSearchParams = new URLSearchParams(window.location.search)
  const isWidescreen = urlSearchParams.get("widescreen") !== null
  const aspectRatio = isWidescreen ? wideScreenRatio : retroRatio
  const targetAspectRatio = window.innerWidth / window.innerHeight

  const minSizeRatio = window.innerWidth < 800 ? 800 / window.innerWidth : 1
  const [newWidth, newHeight] = (
    targetAspectRatio > aspectRatio
      ? [window.innerHeight * aspectRatio * minSizeRatio, window.innerHeight * minSizeRatio]
      : [window.innerWidth * minSizeRatio, (window.innerWidth / aspectRatio) * minSizeRatio]
  ).map(Math.floor)

  viewCanvas.width = newWidth
  viewCanvas.height = newHeight
  viewCanvas.style.width = `${newWidth}px`
  viewCanvas.style.height = `${newHeight}px`
  setDimensions(newWidth, newHeight)

  const gl = viewCanvas.getContext("webgl2")
  if (gl === null) {
    console.error("Your browser doesn't support WebGL")
    return
  }

  let showHelpText = true
  window.addEventListener("keydown", (ev) => {
    if (ev.key.toLowerCase() === "q") {
      showHelpText = !showHelpText
    }
  })
  const docGl = docCanvas.getContext("webgl2")!
  const viewportExtent = { width: gl.canvas.width, height: gl.canvas.height }

  const resources = await loadResources(gl, docGl)
  const renderInstructions = createInstructionRenderer(docGl, resources)
  const isSkipStart = urlSearchParams.get("skipStart") !== null
  const namedScene = urlSearchParams.get("namedScene")
  let scene = createStartingScene(
    isSkipStart
      ? StartingSceneEnum.Docked
      : namedScene !== null
        ? StartingSceneEnum.NamedScene
        : StartingSceneEnum.Pregame,
    resources,
    gl,
    namedScene,
  )
  /*new URLSearchParams(window.location.search).get("skipStart") !== null
    ? createGameScene(resources, gl, RenderEffect.None)
    : createPregameScene(resources, gl)*/
  function render(now: number) {
    scene = scene.update(now, viewportExtent) ?? scene
    requestAnimationFrame(render)
    renderInstructions(showHelpText)
  }
  requestAnimationFrame(render)
}

mount(
  document.getElementById("viewcanvas") as HTMLCanvasElement,
  document.getElementById("doccanvas") as HTMLCanvasElement,
)
