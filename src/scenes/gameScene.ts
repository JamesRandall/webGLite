import {getStartingPlayer} from "../model/player";
import {bindKeys} from "../controls/bindKeys";
import {createSceneRenderer} from "../renderer/flight/sceneRenderer";
import {createStardust} from "../gameloop/stardust";
import {LocalBubble} from "../model/localBubble";
import {createSquareModel, createSquareModelWithTexture} from "../resources/models";
import {generateGalaxy} from "../proceduralGeneration/starSystems";
import {Game, SceneEnum} from "../model/game";
import {createGameLoop} from "../gameloop/gameLoop";
import {createDashboardRenderer} from "../renderer/dashboard/dashboard";
import {Resources} from "../resources/resources";
import {ShipInstance} from "../model/ShipInstance";
import {vec3} from "gl-matrix";
import {worldSize} from "../constants";
import {generateMarketItems} from "../proceduralGeneration/marketItems";
import {bindMouse} from "../controls/bindMouse";

export function createGameScene(resources: Resources, gl: WebGLRenderingContext, dashboardGl: WebGLRenderingContext) {
    //const clipSpaceRadius = 2048
    const clipSpaceRadius = worldSize

    // TODO: The ship models are currently pointing the wrong way round, wwe need to rotate them around Y 180 degrees
    // when we load them!
    const ships : ShipInstance[] = [
        //resources.ships.getCobraMk3(vec3.fromValues(0, 0.0, -scannerRadialWorldRange[2]/2.0), vec3.fromValues(0.0, 0.0, -1.0)),
        //resources.ships.getViper(vec3.fromValues(1500.0, -(scannerRadialWorldRange[1]/9.0), -(scannerRadialWorldRange[2]/3.0)), vec3.fromValues(0.0, 0.0, 1.0)),
        //resources.ships.getCobraMk3(vec3.fromValues(0, -4000.0, 4000.0), vec3.fromValues(0.0, 0.0, -1.0)),
        //getThargoid(vec3.fromValues(0.0, -30.0, -200.0), vec3.fromValues(0.0, 0.0, 1.0))
    ]

    // NOTE: the plan for positioning the sun and planet is that they are opposite each other so we create them
    // simply axis aligned as below and then just randomise the nose orientation of the player (rotating the world
    // around).
    const localBubble : LocalBubble = {
        sun: {
            position: [0,0,clipSpaceRadius-1],
            noseOrientation: [0,0,-1],
            initialOrientation: [0,0,-1],
            roofOrientation: [0,1,0],
            rightOrientation: [1,0,0],
            color: [1.0,0.0,0.0],
            radius: 1300000,
            pitch: 0.0,
            roll: 0.0,
            surfaceTextureIndex: 0,
            model: createSquareModelWithTexture(gl, "/starmask.png")
        },
        planet: {
            position: [0,0,-clipSpaceRadius/2],
            noseOrientation: [0,0,1],
            initialOrientation: [0,0,1],
            roofOrientation: [0, 1, 0],
            rightOrientation: [-1,0,0],
            color: [0.0,0.0,0.8],
            radius: 1,
            pitch: 0.0,
            roll: 0.0,
            surfaceTextureIndex: 0,
            model: createSquareModel(gl, [0.0,0.0,0.8,1.0])
        },
        clipSpaceRadius: clipSpaceRadius,
        ships: ships,
        stardust: createStardust(),
        sunPlanetLightingDirection: [0,0,0]
    }
    localBubble.sunPlanetLightingDirection =
        vec3.normalize(vec3.create(),
            vec3.subtract(vec3.create(), localBubble.sun.position, localBubble.planet.position)
            )

    const stars = generateGalaxy(0, resources.textures.planets.length)
    const startingSystem = stars.find(s => s.name === 'Lave')!
    const game: Game = {
        player: getStartingPlayer(resources, startingSystem),
        stars: stars,
        localBubble: localBubble,
        currentScene: SceneEnum.PlayerDetails,
        launching: null,
        hyperspace: null,
        currentSystem: startingSystem,
        marketItems: generateMarketItems(startingSystem)
    }
    game.player.cargoHoldContents = game.marketItems.map(() => 0)

    bindKeys(game.player.controlState)
    bindMouse(game.player.controlState)
    const sceneRenderer = createSceneRenderer(gl, resources)
    const dashboardRenderer = createDashboardRenderer(dashboardGl)
    return createGameLoop(resources, game, sceneRenderer, dashboardRenderer)
}
