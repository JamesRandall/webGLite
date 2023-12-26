import {vec3} from "gl-matrix";
import {getCobraMk3, getThargoid, getViper, loadShipSpecifications} from "./model/ships";
import {getStartingPlayer} from "./model/player";
import {bindKeys} from "./controls/bindKeys";
import {createSceneRenderer} from "./renderer/scene";
import {createStardust} from "./gameloop/stardust";
import {LocalBubble} from "./model/localBubble";
import {createSquareModel, createSquareModelWithTexture} from "./resources/models";
import {generateGalaxy} from "./proceduralGeneration/starSystems";
import {Game, SceneEnum} from "./model/game";
import {createGameLoop} from "./gameloop/gameLoop";
import {scannerRadialWorldRange} from "./constants";
import {createDashboardRenderer} from "./renderer/dashboard/dashboard";

export async function setupScene(gl: WebGLRenderingContext, dashboardGl: WebGLRenderingContext) {
    await loadShipSpecifications(gl)
    const clipSpaceRadius = 512

    // TODO: The ship models are currently pointing the wrong way round, wwe need to rotate them around Y 180 degrees
    // when we load them!
    const ships = [
        getCobraMk3(vec3.fromValues(0, 0.0, -scannerRadialWorldRange[2]/2.0), vec3.fromValues(0.0, 0.0, -1.0)),
        getViper(vec3.fromValues(1500.0, -(scannerRadialWorldRange[1]/9.0), -(scannerRadialWorldRange[2]/3.0)), vec3.fromValues(0.0, 0.0, 1.0)),
        getCobraMk3(vec3.fromValues(0, -4000.0, 4000.0), vec3.fromValues(0.0, 0.0, -1.0)),
        //getThargoid(vec3.fromValues(0.0, -30.0, -200.0), vec3.fromValues(0.0, 0.0, 1.0))
    ]

    // NOTE: the plan for positioning the sun and planet is that they are opposite each other so we create them
    // simply axis aligned as below and then just randomise the nose orientation of the player (rotating the world
    // around).
    const localBubble : LocalBubble = {
        sun: {
            position: [0,0,-clipSpaceRadius+1],
            orientation: [0,0,1],
            upOrientation: [0,1,0],
            color: [1.0,0.0,0.0],
            radius: 1/0,
            distance: 1.0,
            model: createSquareModelWithTexture(gl, "/starmask.png")
        },
        planet: {
            position: [0,0,clipSpaceRadius],
            orientation: [0,0,-1],
            upOrientation: [0, 1, 0],
            color: [0.0,0.0,0.8],
            radius: 1/0,
            distance: 1.0,
            model: createSquareModel(gl, [0.0,0.0,0.8,1.0])
        },
        clipSpaceRadius: clipSpaceRadius,
        ships: ships,
        stardust: createStardust()
    }

    const stars = generateGalaxy(0)
    const startingSystem = stars.find(s => s.name === 'Lave')!
    const game: Game = {
        player: getStartingPlayer(startingSystem),
        stars: stars,
        localBubble: localBubble,
        currentScene: SceneEnum.Front
    }

    bindKeys(game.player.controlState)
    const sceneRenderer = createSceneRenderer(gl)
    const dashboardRenderer = createDashboardRenderer(dashboardGl)
    return createGameLoop(game, sceneRenderer, dashboardRenderer)
}
