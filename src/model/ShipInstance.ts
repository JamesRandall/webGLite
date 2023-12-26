import {vec3} from "gl-matrix";
import {ShipSpecification} from "./ships";

export interface ShipInstance {
    type: ShipSpecification,
    position: vec3,
    noseOrientation: vec3
    roofOrientation: vec3
    rightOrientation: vec3,
    roll: number,
    totalRoll: number,
    pitch: number,
    totalPitch: number,
    speed: number,
    rendering: {
        shininess: number
    }
}