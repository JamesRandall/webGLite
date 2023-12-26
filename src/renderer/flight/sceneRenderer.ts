import {createShipsRenderer} from "./ships";
import {createStardustRenderer} from "./stardust";
import {createSunRenderer} from "./sun";
import {createPrimitiveRenderer, Primitives} from "../primitives/primitives";
import {Game, SceneEnum} from "../../model/game";
import {createLocalChartRenderer} from "../screens/localChart";
import {frameColor, frameWidth} from "../../constants";
import {createSystemDetailsRenderer} from "../screens/systemDetails";
import {drawFrame, setupGl} from "../common";

export function createSceneRenderer(gl:WebGLRenderingContext) {
    const shipRenderer = createShipsRenderer(gl)
    const stardustRenderer = createStardustRenderer(gl)
    const sunRenderer = createSunRenderer(gl)
    const draw2d = createPrimitiveRenderer(gl)
    const localChartRenderer = createLocalChartRenderer(draw2d)
    const systemDetailsRenderer = createSystemDetailsRenderer(draw2d)

    return (game:Game, timeDelta:number) => {
        setupGl(gl)

        switch(game.currentScene) {
            case SceneEnum.Front:
                shipRenderer(game.localBubble)
                sunRenderer(game.localBubble,timeDelta)
                stardustRenderer(game.localBubble)

                break;
            case SceneEnum.LocalMap:
                localChartRenderer(game)
                break;
            case SceneEnum.SystemDetails:
                systemDetailsRenderer(game)
        }

        gl.disable(gl.DEPTH_TEST)
        drawFrame(draw2d)
    }
}