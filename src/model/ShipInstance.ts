import {ShipSpecification} from "./ships";
import {PositionedObject} from "./localBubble";

export interface ShipInstance extends PositionedObject {
    type: ShipSpecification,
    totalRoll: number,
    totalPitch: number,
    speed: number,
    rendering: {
        shininess: number
    }
}