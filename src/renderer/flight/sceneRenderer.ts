import {createShipsRenderer} from "./ships";
import {createStardustRenderer} from "./stardust";
import {createSunRenderer} from "./sun";
import {createPrimitiveRenderer} from "../primitives/primitives";
import {Game, SceneEnum} from "../../model/game";
import {createLocalChartRenderer} from "../screens/localChart";
import {createSystemDetailsRenderer} from "../screens/systemDetails";
import {drawFrame, setupGl} from "../common";
import {createPlayerDetailsRenderer} from "../screens/playerDetails";
import {createLaunchingRenderer} from "../screens/launching";
import {createPlanetRenderer} from "./planet";
import {createHyperspaceRenderer} from "../screens/hyperspace";

export function createSceneRenderer(gl:WebGLRenderingContext) {
    const shipRenderer = createShipsRenderer(gl)
    const stardustRenderer = createStardustRenderer(gl)
    const sunRenderer = createSunRenderer(gl)
    const planetRenderer = createPlanetRenderer(gl)
    const draw2d = createPrimitiveRenderer(gl)
    const localChartRenderer = createLocalChartRenderer(draw2d)
    const systemDetailsRenderer = createSystemDetailsRenderer(draw2d)
    const playerDetailsRenderer = createPlayerDetailsRenderer(draw2d)
    const launchingRenderer = createLaunchingRenderer(gl)
    const hyperspaceRenderer = createHyperspaceRenderer(gl)

    return (game:Game, timeDelta:number) => {
        setupGl(gl)

        switch(game.currentScene) {
            case SceneEnum.Front:
                shipRenderer(game.localBubble)
                sunRenderer(game.localBubble,timeDelta)
                planetRenderer(game.localBubble,timeDelta)
                stardustRenderer(game.localBubble)
                break

            case SceneEnum.LocalMap:
                localChartRenderer(game)
                break

            case SceneEnum.SystemDetails:
                systemDetailsRenderer(game)
                break

            case SceneEnum.PlayerDetails:
                playerDetailsRenderer(game)
                break

            case SceneEnum.Launching:
                launchingRenderer(game)

            case SceneEnum.Hyperspace:
                hyperspaceRenderer(game)
        }

        gl.disable(gl.DEPTH_TEST)
        drawFrame(draw2d)
        if (game.hyperspace !== null && game.hyperspace.countdown > 0) {
            draw2d.text.draw(game.hyperspace.countdown.toString(), [0.5,0.5])
            const hyperspaceText = `HYPERSPACE - ${game.player.selectedSystem.name}`
            const xPos = 38/2 - hyperspaceText.length/2
            draw2d.text.draw(hyperspaceText, [xPos,21.5])
        }
    }
}