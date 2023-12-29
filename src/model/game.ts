import {Player} from "./player";
import {StarSystem} from "./starSystem";
import {LocalBubble} from "./localBubble";

export enum SceneEnum {
    Front,
    LocalMap,
    SystemDetails,
    PlayerDetails,
    Inventory,
    Launching,
    Hyperspace
}

export interface LaunchingData {
    outboundRadii: number[]
    inboundRadii: number[]
}

export interface HyperspaceData {
    countdown: number
    rotation: number
    outboundRadii: number[]
    inboundRadii: number[]
}

export interface Game {
    player: Player
    localBubble: LocalBubble
    stars: StarSystem[]
    currentScene: SceneEnum
    launching: LaunchingData | null
    hyperspace: HyperspaceData | null
}