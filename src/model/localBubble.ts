import {vec3} from "gl-matrix";
import {Model} from "../resources/models";
import {ShipInstance} from "./ShipInstance";

export interface PositionedObject {
    position: vec3
    noseOrientation: vec3
    roofOrientation: vec3
    rightOrientation: vec3
}

export interface OrbitalBody extends PositionedObject {
    color: vec3
    initialOrientation: vec3
    //distance: number
    radius: number
    model: Model
}

export interface LocalBubble {
    sun: OrbitalBody
    planet: OrbitalBody
    clipSpaceRadius: number
    ships: ShipInstance[]
    stardust: vec3[]
    sunPlanetLightingDirection: vec3
}
