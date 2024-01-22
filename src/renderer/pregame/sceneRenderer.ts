import {createShipsRenderer} from "../flight/ships";
import {createPrimitiveRenderer} from "../primitives/primitives";
import {Game} from "../../model/game";
import {createProjectionMatrix, drawFrame, setupGl} from "../common";
import {Resources} from "../../resources/resources";

export function createPregameSceneRenderer(gl:WebGLRenderingContext, resources: Resources) {
    const canvas = gl.canvas as HTMLCanvasElement
    const viewportWidth = canvas.clientWidth
    const viewportHeight = canvas.clientHeight

    const shipRenderer = createShipsRenderer(gl, resources)
    const draw2d = createPrimitiveRenderer(gl, false, resources, viewportWidth, viewportHeight)

    return (game:Game, timeDelta:number) => {
        const projectionMatrix = createProjectionMatrix(viewportWidth, viewportHeight, game.localBubble.clipSpaceRadius)

        setupGl(gl)
        gl.enable(gl.DEPTH_TEST)
        shipRenderer(projectionMatrix, game.localBubble)
        gl.disable(gl.DEPTH_TEST)
        drawFrame(draw2d)
        draw2d.text.draw("---- webGLite ----", [10,1])
        draw2d.text.draw("based on Elite", [12,2.5])
        draw2d.text.draw("by Ian Bell and David Braben", [4.5,4])
        draw2d.text.draw("Press Space Or Fire, Commander", [3.5,21])
    }
}