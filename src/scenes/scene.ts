import {Size} from "../model/geometry";

export interface Scene {
    update: ((now: number, viewportExtent: Size) => Scene | null)
}