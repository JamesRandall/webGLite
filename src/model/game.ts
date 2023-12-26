import {Player} from "./player";
import {StarSystem} from "./starSystem";
import {LocalBubble} from "./localBubble";

export enum SceneEnum {
    Front,
    LocalMap,
    SystemDetails
}

export interface Game {
    player: Player
    localBubble: LocalBubble
    stars: StarSystem[]
    currentScene: SceneEnum
}