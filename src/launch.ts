import { createGameScene } from "./scenes/gameScene"
import { loadResources, Resources } from "./resources/resources"
import { createPregameScene } from "./scenes/pregameScene"
import { RenderEffect } from "./renderer/rootRenderer"
import { createInstructionRenderer } from "./renderer/instructions/renderInstructions"
import { createStartingScene, StartingSceneEnum } from "./scenes/sceneFactory"
import { dimensions, setDimensions } from "./constants"
import { createLoadingScreenRenderer } from "./renderer/loadingScreen/loadingScreen"
import { Scene } from "./scenes/scene"

require("./extensions.ts")

async function mount(viewCanvas: HTMLCanvasElement) {
  const retroRatio = 800 / 760
  const wideScreenRatio = 16 / 9
  const urlSearchParams = new URLSearchParams(window.location.search)
  const isWidescreen = urlSearchParams.get("widescreen") !== null

  function setSize() {
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

    console.log(dimensions)
  }
  setSize()

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
  const viewportExtent = { width: gl.canvas.width, height: gl.canvas.height }

  let resources: Resources | null = null

  const loadingScreen: ((now: number, resourcesReady: boolean) => boolean) | null =
    await createLoadingScreenRenderer(gl)
  let scene: Scene | null = null
  function renderGame(now: number) {
    if (scene !== null) {
      scene = scene.update(now, viewportExtent) ?? scene
    } else if (resources !== null) {
      const isSkipStart = urlSearchParams.get("skipStart") !== null
      const namedScene = urlSearchParams.get("namedScene")
      scene = createStartingScene(
        isSkipStart
          ? StartingSceneEnum.Docked
          : namedScene !== null
            ? StartingSceneEnum.NamedScene
            : StartingSceneEnum.Pregame,
        resources,
        gl!,
        namedScene,
      )
    }
    requestAnimationFrame(renderGame)
  }
  function render(now: number) {
    if (loadingScreen !== null) {
      if (loadingScreen(now, resources !== null) && resources !== null) {
        requestAnimationFrame(renderGame)
        return
      }
    }
    requestAnimationFrame(render)
  }

  if (urlSearchParams.get("skipStart") !== null || urlSearchParams.get("namedScene") !== null) {
    requestAnimationFrame(renderGame)
  } else {
    requestAnimationFrame(render)
  }

  resources = await loadResources(gl)
}

mount(document.getElementById("viewcanvas") as HTMLCanvasElement)
