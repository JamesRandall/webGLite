import {createShipsRenderer} from "../flight/ships";
import {createPrimitiveRenderer} from "../primitives/primitives";
import {Game} from "../../model/game";
import {drawFrame, setupGl} from "../common";

export function createPregameSceneRenderer(gl:WebGLRenderingContext) {
    const shipRenderer = createShipsRenderer(gl)
    const draw2d = createPrimitiveRenderer(gl)

    return (game:Game, timeDelta:number) => {
        setupGl(gl)

        shipRenderer(game.localBubble)

        gl.disable(gl.DEPTH_TEST)
        drawFrame(draw2d)
        draw2d.text.draw("---- webGLite ----", [10,1])
        draw2d.text.draw("based on Elite", [12,2.5])
        draw2d.text.draw("by Ian Bell and David Braben", [4.5,4])
        draw2d.text.draw("Press Space Or Fire, Commander", [3.5,21])
    }
}