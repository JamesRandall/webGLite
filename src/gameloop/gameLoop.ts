import {Game, SceneEnum} from "../model/game";
import {Size} from "../model/geometry";
import {flightLoop} from "./flightLoop";
import {Scene} from "../scenes/scene";
import {createLaunchingLoop} from "./launching";
import {applyControlState} from "./applyControlState";
import {Resources} from "../resources/resources";
import {createHyperspaceLoop} from "./hyperspace";

function applySceneSelection(game: Game) {
    if (game.player.controlState.sceneSelection === null) { return; }

    if (game.player.isDocked) {
        // scenes are slightly different when docked
        switch (game.player.controlState.sceneSelection!) {
            case 1: game.currentScene = SceneEnum.Launching; break;
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
            applyControlState(game, deltaTime)

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

            drawScene(game, deltaTime)
            drawDashboard(game)
            return null
        }
    }
    return scene
}
