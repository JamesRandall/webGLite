import {Game, SceneEnum} from "../model/game";
import {Size} from "../model/geometry";
import {flightLoop} from "./flightLoop";
import {Scene} from "../scenes/scene";
import {createLaunchingLoop} from "./launching";
import {applyControlState} from "./applyControlState";
import {Resources} from "../resources/resources";
import {createHyperspaceLoop} from "./hyperspace";
import {ShipRoleEnum} from "../model/ShipInstance";
import {vec3} from "gl-matrix";

function applySceneSelection(game: Game) {
    if (game.player.controlState.sceneSelection === null) { return; }

    if (game.player.isDocked) {
        // scenes are slightly different when docked
        switch (game.player.controlState.sceneSelection!) {
            case 1: game.currentScene = SceneEnum.Launching; break;
            case 2: game.currentScene = SceneEnum.BuyMarketItems; break;
            case 6: game.currentScene = SceneEnum.LocalMap; break;
            case 7: game.currentScene = SceneEnum.SystemDetails; break;
            case 9: game.currentScene = SceneEnum.PlayerDetails; break;
        }
    }
    else {
        switch (game.player.controlState.sceneSelection!) {
            case 1: game.currentScene = SceneEnum.Front; break;
            case 6: game.currentScene = SceneEnum.LocalMap; break;
            case 7: game.currentScene = SceneEnum.SystemDetails; break;
            case 9: game.currentScene = SceneEnum.PlayerDetails; break;
        }
    }
    game.player.controlState.sceneSelection = null;
}

function applyHyperspaceCountdown(game: Game, hyperspaceClock: number | null, deltaTime: number)
{
    if (hyperspaceClock === null && game.hyperspace !== null) {
        hyperspaceClock = 0
    }
    else if (hyperspaceClock !== null) {
        if (hyperspaceClock > 0.1 && game.hyperspace !== null) {
            game.hyperspace.countdown--
            if (game.hyperspace.countdown === 0) {
                game.currentScene = SceneEnum.Hyperspace
            }
            else {
                hyperspaceClock = 0
            }
        }
        else {
            hyperspaceClock += deltaTime
        }
    }
    return hyperspaceClock
}

export function createGameLoop(resources: Resources, game: Game, drawScene: (game: Game, timeDelta: number) => void, drawDashboard: (game: Game) => void) {
    let then = 0;
    let deltaTime = 0
    let launchingLoop: ((deltaTime: number) => void) | null = null
    let hyperspaceLoop: ((deltaTime: number) => void) | null = null
    let hyperspaceClock: number | null = null

    const scene: Scene = {
        update: (now: number, viewportExtent: Size) => {
            now *= 0.001; // convert to seconds
            deltaTime = now - then
            then = now;

            hyperspaceClock = applyHyperspaceCountdown(game, hyperspaceClock, deltaTime)
            applySceneSelection(game)
            applyControlState(game, resources, deltaTime)

            // the flight loop runs even if we're looking at another screen in gameplay unless we are docked
            if (!game.player.isDocked) {
                flightLoop(game, deltaTime)
            }
            if (game.currentScene === SceneEnum.Launching) {
                if (launchingLoop === null) {
                    launchingLoop = createLaunchingLoop(game, resources)
                }
                launchingLoop!(deltaTime)
            }
            else if (game.currentScene === SceneEnum.Hyperspace) {
                if (hyperspaceLoop === null) {
                    hyperspaceLoop = createHyperspaceLoop(game, resources)
                }
                hyperspaceLoop!(deltaTime)
            }

            // !!!!!!!!!! A diag for roof orientation
            // Also see in updateGameOnLaunch.ts
            /*const cobra = game.localBubble.ships.find(s => s.role !== ShipRoleEnum.Station)
            const station = game.localBubble.ships.find(s => s.role === ShipRoleEnum.Station)
            if (station && cobra) {
                const stationRoofDelta = vec3.multiply(vec3.create(), station.roofOrientation, [50,50,50])
                const cobraPosition = vec3.add(vec3.create(), station.position, stationRoofDelta)
                cobra.position = cobraPosition
            }*/
            ///// END OF DIG

            drawScene(game, deltaTime)
            drawDashboard(game)
            game.player.previousControlState = {...game.player.controlState}
            return null
        }
    }
    return scene
}
