import {setupScene} from "./staticShipScene";
require("./extensions.ts")

async function mount(viewCanvas: HTMLCanvasElement, dashboardCanvas: HTMLCanvasElement) {
    const gl = viewCanvas.getContext("webgl2")
    if (gl === null) {
        console.error("Your browser doesn't support WebGL")
        return
    }
    const dashboardGl = dashboardCanvas.getContext("webgl2")!

    const drawScene = await setupScene(gl, dashboardGl)
    // TODO: we need to look for this resizing
    const viewportExtent = { width: gl.canvas.width, height: gl.canvas.height }

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