import {createGameScene} from "./scenes/gameScene";
import {loadResources} from "./resources/resources";
require("./extensions.ts")

async function mount(viewCanvas: HTMLCanvasElement, dashboardCanvas: HTMLCanvasElement) {
    const gl = viewCanvas.getContext("webgl2")
    if (gl === null) {
        console.error("Your browser doesn't support WebGL")
        return
    }
    const dashboardGl = dashboardCanvas.getContext("webgl2")!
    const viewportExtent = { width: gl.canvas.width, height: gl.canvas.height }

    const resources = await loadResources(gl)

    const drawScene = createGameScene(resources, gl, dashboardGl)
    function render(now:number) {
        drawScene(now, viewportExtent);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render)
}

mount(
    document.getElementById('viewcanvas') as HTMLCanvasElement,
    document.getElementById('dashboardcanvas') as HTMLCanvasElement
)