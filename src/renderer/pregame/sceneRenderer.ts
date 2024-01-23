import {createShipsRenderer} from "../flight/ships";
import {createPrimitiveRenderer} from "../primitives/primitives";
import {Game} from "../../model/game";
import {createProjectionMatrix, drawFrame, setupGl} from "../common";
import {Resources} from "../../resources/resources";
import {dimensions} from "../../constants";

export function createPregameSceneRenderer(gl:WebGLRenderingContext, resources: Resources) {
    const canvas = gl.canvas as HTMLCanvasElement

    const shipRenderer = createShipsRenderer(gl, resources)
    const draw2d = createPrimitiveRenderer(gl, false, resources, dimensions.width, dimensions.mainViewHeight)

    return (game:Game, timeDelta:number) => {
        const projectionMatrix = createProjectionMatrix(dimensions.width, dimensions.mainViewHeight, game.localBubble.clipSpaceRadius)

        setupGl(gl)
        gl.enable(gl.DEPTH_TEST)
        gl.enable(gl.CULL_FACE)
        shipRenderer(projectionMatrix, game.localBubble)
        gl.disable(gl.DEPTH_TEST)
        gl.disable(gl.CULL_FACE)
        drawFrame(draw2d)
        draw2d.text.draw("---- webGLite ----", [10,1])
        draw2d.text.draw("based on Elite", [12,2.5])
        draw2d.text.draw("by Ian Bell and David Braben", [4.5,4])
        draw2d.text.draw("Press Space Or Fire, Commander", [3.5,21])
    }
}