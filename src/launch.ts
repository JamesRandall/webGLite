import { loadResources, Resources } from "./resources/resources"
import { createStartingScene, StartingSceneEnum } from "./scenes/sceneFactory"
import { dimensions, setDimensions } from "./constants"
import { createLoadingScreenRenderer } from "./renderer/loadingScreen/loadingScreen"
import { Scene } from "./scenes/scene"

require("./extensions.ts")

async function mount(viewCanvas: HTMLCanvasElement) {
  const retroRatio = 800 / 760
  const wideScreenRatio = 16 / 9
  // case insensitive launch params
  const urlSearchParams = new URLSearchParams(
    Array.from(new URLSearchParams(window.location.search), ([key, value]) => [key.toLowerCase(), value]),
  )
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

  const loadingScreen: { resize: () => void; render: (now: number, resourcesReady: boolean) => boolean } | null =
    await createLoadingScreenRenderer(gl)
  let scene: Scene | null = null
  function renderGame(now: number) {
    if (scene !== null) {
      scene = scene.update(now, viewportExtent) ?? scene
    } else if (resources !== null) {
      const isSkipStart = urlSearchParams.get("skipstart") !== null
      const namedScene = urlSearchParams.get("namedscene")
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
      if (loadingScreen.render(now, resources !== null) && resources !== null) {
        requestAnimationFrame(renderGame)
        return
      }
    }
    requestAnimationFrame(render)
  }

  if (urlSearchParams.get("skipstart") !== null || urlSearchParams.get("namedscene") !== null) {
    requestAnimationFrame(renderGame)
  } else {
    requestAnimationFrame(render)
  }

  resources = await loadResources(gl)

  let resizeDebounce: ReturnType<typeof setTimeout> | undefined = undefined
  window.addEventListener("resize", (ev) => {
    clearTimeout(resizeDebounce)
    resizeDebounce = setTimeout(() => {
      setSize()
      if (loadingScreen !== null) {
        loadingScreen.resize()
      }
      if (scene !== null) {
        scene.resize(gl)
      }
    }, 100)
  })
}

mount(document.getElementById("viewcanvas") as HTMLCanvasElement)
