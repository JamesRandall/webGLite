import { createGameScene } from "./scenes/gameScene"
import { loadResources } from "./resources/resources"
import { createPregameScene } from "./scenes/pregameScene"
import { RenderEffect } from "./renderer/rootRenderer"
import { createInstructionRenderer } from "./renderer/instructions/renderInstructions"
import { createStartingScene, StartingSceneEnum } from "./scenes/sceneFactory"

require("./extensions.ts")

async function mount(viewCanvas: HTMLCanvasElement, docCanvas: HTMLCanvasElement) {
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
  const urlSearchParams = new URLSearchParams(window.location.search)
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
