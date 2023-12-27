import {vec3} from "gl-matrix";
import {Model} from "../resources/models";
import {ShipInstance} from "./ShipInstance";

export interface OrbitalBody {
    color: vec3
    position: vec3
    orientation: vec3
    upOrientation: vec3
    initialOrientation: vec3
    distance: number
    radius: number
    model: Model
}

export interface LocalBubble {
    sun: OrbitalBody
    planet: OrbitalBody
    clipSpaceRadius: number
    ships: ShipInstance[]
    stardust: vec3[]
}
