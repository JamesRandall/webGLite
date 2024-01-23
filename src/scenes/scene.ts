import {Size} from "../model/geometry";
import {Game} from "../model/game";

export interface Scene {
    update: ((now: number, viewportExtent: Size) => Scene | null)
}

export type RendererFunc = (game: Game, timeDelta: number) => void