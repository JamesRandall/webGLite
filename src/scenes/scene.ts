import {Size} from "../model/geometry";
import {Game} from "../model/game";
import {RenderEffect} from "./rootRenderer";

export interface Scene {
    update: ((now: number, viewportExtent: Size) => Scene | null)
}

export type RendererFunc = (game: Game, timeDelta: number) => void
export type RendererEffectFunc = (game: Game, timeDelta: number, effect: RenderEffect) => void