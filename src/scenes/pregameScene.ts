import {Resources} from "../resources/resources";
import {vec3} from "gl-matrix";
import {scannerRadialWorldRange} from "../constants";
import {LocalBubble} from "../model/localBubble";
import {createSquareModel, createSquareModelWithTexture} from "../resources/models";
import {createStardust} from "../gameloop/stardust";
import {createPregameSceneRenderer} from "../renderer/pregame/sceneRenderer";
import {createDashboardRenderer} from "../renderer/dashboard/dashboard";
import {generateGalaxy} from "../proceduralGeneration/starSystems";
import {Game, SceneEnum} from "../model/game";
import {getStartingPlayer} from "../model/player";
import {Scene} from "./scene";
import {Size} from "../model/geometry";
import {updateShipInstance} from "../gameloop/updateShipInstance";
import {createGameScene} from "./gameScene";

const startingZ = -scannerRadialWorldRange[2]
const targetZ = -scannerRadialWorldRange[2] / 24.0

export function createPregameScene(resources: Resources, gl: WebGLRenderingContext, dashboardGl: WebGLRenderingContext) {
    const clipSpaceRadius = 512
    const startingShip = 0

    // TODO: The ship models are currently pointing the wrong way round, wwe need to rotate them around Y 180 degrees
    // when we load them!
    const ships = [
        //resources.ships.getCobraMk3(vec3.fromValues(0, 0.0, -scannerRadialWorldRange[2] / 24.0), vec3.fromValues(0.0, 0.0, -1.0))
        resources.ships.getIndexedShip(startingShip, vec3.fromValues(0, 0.0, startingZ), vec3.fromValues(0.0, 0.0, -1.0))
    ]
    ships[0].roll = ships[0].type.maxRollSpeed
    ships[0].pitch = ships[0].type.maxPitchSpeed*2

    const localBubble : LocalBubble = {
        sun: {
            position: [-1000,1000,3],
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
        player: getStartingPlayer(resources, startingSystem),
        stars: stars,
        localBubble: localBubble,
        currentScene: SceneEnum.Front,
        launching: null
    }

    const sceneRenderer = createPregameSceneRenderer(gl)
    const dashboardRenderer = createDashboardRenderer(dashboardGl)
    return createPregameLoop(game, gl, dashboardGl, resources, sceneRenderer, dashboardRenderer)
}

function createPregameLoop(game: Game, gl:WebGLRenderingContext, dashboardGl: WebGLRenderingContext, resources:Resources, drawScene: (game: Game, timeDelta: number) => void, drawDashboard: (game: Game) => void) {
    const timeToStay = 6.0
    let then = 0;
    let deltaTime = 0
    let isMovingIn = true
    let isMovingOut = false
    let timeSinceMovedIn = 0
    let currentShipIndex = 0
    let speed = startingZ / 2
    let startGame = false

    function createShip()
    {
        game.localBubble.ships[0] = resources.ships.getIndexedShip(currentShipIndex, vec3.fromValues(0, 0.0, startingZ), vec3.fromValues(0.0, 0.0, -1.0))
        game.localBubble.ships[0].roll = game.localBubble.ships[0].type.maxRollSpeed*2
        game.localBubble.ships[0].pitch = -game.localBubble.ships[0].type.maxPitchSpeed
    }

    function nextShip() {
        currentShipIndex++
        if (currentShipIndex >= resources.ships.numberOfShips) {
            currentShipIndex = 0
        }
        createShip()
    }

    function previousShip() {
        currentShipIndex--
        if (currentShipIndex < 0) {
            currentShipIndex = resources.ships.numberOfShips - 1
        }
        createShip()
    }

    const keyDown = (e:KeyboardEvent) => {
        const existingPosition = game.localBubble.ships[0].position
        const existingRoll = game.localBubble.ships[0].roll
        const existingPitch = game.localBubble.ships[0].pitch
        if (e.key === "ArrowRight") {
            nextShip()
        }
        else if (e.key === "ArrowLeft") {
            previousShip()
        }
        else if (e.key === " ") {
            startGame = true
        }
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            game.localBubble.ships[0].position = existingPosition
            game.localBubble.ships[0].roll = existingRoll
            game.localBubble.ships[0].pitch = existingPitch
        }
    }

    window.addEventListener("keydown", keyDown)

    const scene: Scene = {
        update: (now: number, viewportExtent: Size) => {
            if (startGame) {
                window.removeEventListener("keydown", keyDown)
                return createGameScene(resources, gl, dashboardGl)
            }

            now *= 0.001; // convert to seconds
            deltaTime = now - then
            then = now;

            updateShipInstance(game.localBubble.ships[0], game.player, deltaTime)

            // we can't use the ships speed to move it in as that follows the direction of the nose orientation
            if (isMovingIn) {
                game.localBubble.ships[0].position[2] -= speed * deltaTime
                if (game.localBubble.ships[0].position[2] >= targetZ) {
                    isMovingIn = false
                    timeSinceMovedIn = now
                }
            } else if (isMovingOut) {
                game.localBubble.ships[0].position[2] += speed * deltaTime
                if (game.localBubble.ships[0].position[2] <= startingZ) {
                    nextShip()
                    isMovingIn = true
                    isMovingOut = false
                }
            }
            else if (now > (timeSinceMovedIn + timeToStay)) {
                isMovingOut = true
            }

            drawScene(game, deltaTime)
            drawDashboard(game)
            return null
        }
    }
    return scene
}