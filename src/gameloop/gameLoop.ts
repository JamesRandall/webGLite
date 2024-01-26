import {Game, SceneEnum} from "../model/game";
import {Size} from "../model/geometry";
import {flightLoop} from "./flightLoop";
import {RendererEffectFunc, Scene} from "../scenes/scene";
import {createLaunchingLoop} from "./launching";
import {applyControlState} from "./applyControlState";
import {Resources} from "../resources/resources";
import {createHyperspaceLoop} from "./hyperspace";
import {createDockingLoop} from "./docking";
import {RenderEffect} from "../renderer/rootRenderer";

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

function shouldRunFlightLoop(game:Game) {
    return !game.player.isDocked &&
        game.currentScene != SceneEnum.Hyperspace &&
        game.currentScene != SceneEnum.Launching &&
        game.currentScene != SceneEnum.PlayerExploding &&
        game.currentScene != SceneEnum.Docking
}

export function createGameLoop(resources: Resources, game: Game, renderer: RendererEffectFunc) {
    let then = 0;
    let deltaTime = 0
    let launchingLoop: ((deltaTime: number) => void) | null = null
    let dockingLoop: ((deltaTime: number) => void) | null = null
    let hyperspaceLoop: ((deltaTime: number) => void) | null = null
    let hyperspaceClock: number | null = null

    const scene: Scene = {
        update: (now: number, _: Size) => {
            now *= 0.001; // convert to seconds
            deltaTime = now - then
            then = now;
            game.diagnostics = []
            hyperspaceClock = applyHyperspaceCountdown(game, hyperspaceClock, deltaTime)
            applySceneSelection(game)
            applyControlState(game, resources, deltaTime)

            if (shouldRunFlightLoop(game)) {
                flightLoop(game, deltaTime)
            }
            if (game.currentScene === SceneEnum.Launching) {
                if (launchingLoop === null) {
                    launchingLoop = createLaunchingLoop(game, resources, () => launchingLoop = null)
                }
                launchingLoop!(deltaTime)
            }
            else if (game.currentScene === SceneEnum.Hyperspace) {
                if (hyperspaceLoop === null) {
                    hyperspaceLoop = createHyperspaceLoop(game, resources, () => hyperspaceLoop = null)
                }
                hyperspaceLoop!(deltaTime)
            }
            else if (game.currentScene === SceneEnum.Docking) {
                if (dockingLoop === null) {
                    dockingLoop = createDockingLoop(game, resources, () => dockingLoop = null)
                }
                dockingLoop!(deltaTime)
            }

            renderer(game, deltaTime, game.renderEffect)
            game.player.previousControlState = {...game.player.controlState}
            return null
        }
    }
    return scene
}
