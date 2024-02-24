import { Size } from "../model/geometry"
import { Game } from "../model/game"
import { RenderEffect } from "../renderer/rootRenderer"

export interface Scene {
  update: (now: number, viewportExtent: Size) => Scene | null
  resize: (gl: WebGL2RenderingContext) => void
}

export type RendererFunc = (game: Game, timeDelta: number) => void
export type RendererEffectFunc = (game: Game, timeDelta: number, effect: RenderEffect) => void
