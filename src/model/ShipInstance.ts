import {ShipSpecification} from "./ships";
import {PositionedObject} from "./localBubble";

export interface ShipInstance extends PositionedObject {
    type: ShipSpecification,
    roll: number,
    totalRoll: number,
    pitch: number,
    totalPitch: number,
    speed: number,
    rendering: {
        shininess: number
    }
}