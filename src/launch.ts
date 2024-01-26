import {createGameScene} from "./scenes/gameScene";
import {loadResources} from "./resources/resources";
import {createPregameScene} from "./scenes/pregameScene";
import {RenderEffect} from "./renderer/rootRenderer";

require("./extensions.ts")

async function mount(viewCanvas: HTMLCanvasElement, dashboardCanvas: HTMLCanvasElement) {
    const gl = viewCanvas.getContext("webgl2")
    if (gl === null) {
        console.error("Your browser doesn't support WebGL")
        return
    }
    const viewportExtent = { width: gl.canvas.width, height: gl.canvas.height }

    const resources = await loadResources(gl)

    //let scene = createGameScene(resources, gl, dashboardGl)
    let scene =
        new URLSearchParams(window.location.search).get("skipStart") !== null ?
            createGameScene(resources, gl, RenderEffect.None) : createPregameScene(resources, gl)
    function render(now:number) {
        scene = scene.update(now, viewportExtent) ?? scene;
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render)
}

mount(
    document.getElementById('viewcanvas') as HTMLCanvasElement,
    document.getElementById('dashboardcanvas') as HTMLCanvasElement
)