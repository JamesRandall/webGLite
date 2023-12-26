import {Player} from "./player";
import {StarSystem} from "./starSystem";
import {LocalBubble} from "./localBubble";

export enum SceneEnum {
    Front,
    LocalMap,
    SystemDetails,
    PlayerDetails,
    Inventory,
    Launching
}

export interface LaunchingData {
    outboundRadii: number[]
    inboundRadii: number[]
}

export interface Game {
    player: Player
    localBubble: LocalBubble
    stars: StarSystem[]
    currentScene: SceneEnum
    launching: LaunchingData | null
}