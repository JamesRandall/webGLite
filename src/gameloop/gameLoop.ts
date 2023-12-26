import {Game, SceneEnum} from "../model/game";
import {Size} from "../model/geometry";
import {flightLoop} from "./flightLoop";

function applySceneSelection(game: Game) {
    if (game.player.controlState.sceneSelection === null) { return; }

    if (game.player.isDocked) {
        // scenes are slightly different when docked
    }
    else {
        switch (game.player.controlState.sceneSelection!) {
            case 1: game.currentScene = SceneEnum.Front; break;
            case 6: game.currentScene = SceneEnum.LocalMap; break;
            case 7: game.currentScene = SceneEnum.SystemDetails; break;
        }
    }
    game.player.controlState.sceneSelection = null;
}

export function createGameLoop(game: Game, drawScene: (game: Game, timeDelta: number) => void, drawDashboard: (game: Game) => void) {
    let then = 0;
    let deltaTime = 0
    return (now: number, viewportExtent: Size) => {
        now *= 0.001; // convert to seconds
        deltaTime = now - then
        then = now;

        applySceneSelection(game)

        // the flight loop runs even if we're looking at another screen in gameplay
        if (!game.player.isDocked) {
            flightLoop(game, deltaTime)
        }

        drawScene(game, deltaTime)
        drawDashboard(game)
    }
}
