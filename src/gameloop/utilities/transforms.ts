import {vec3} from "gl-matrix";
import {PositionedObject} from "../../model/localBubble";
import {ShipInstance} from "../../model/ShipInstance";
import {Player} from "../../model/player";

export function degreesToRadians(value: number) {
    return value*Math.PI/180
}

export function radiansToDegrees(value:number) {
    return value*(180/Math.PI)
}

export function rotateOrientationVectorsByPitchAndRoll(object: PositionedObject, roll:number, pitch:number) {
    vec3.rotateZ(object.noseOrientation, object.noseOrientation, [0,0,0], roll)
    vec3.rotateZ(object.roofOrientation, object.roofOrientation, [0,0,0], roll)
    //vec3.rotateZ(shipInstance.rightOrientation, shipInstance.rightOrientation, [0,0,0], player.roll * timeDelta)
    vec3.rotateX(object.noseOrientation, object.noseOrientation, [0,0,0], pitch)
    vec3.rotateX(object.roofOrientation, object.roofOrientation, [0,0,0], pitch)
    //vec3.rotateX(shipInstance.rightOrientation, shipInstance.rightOrientation, [0,0,0], player.pitch * timeDelta)
    vec3.normalize(object.noseOrientation,object.noseOrientation)
    vec3.normalize(object.roofOrientation,object.roofOrientation)
}

export function rotateLocationInSpaceByPitchAndRoll(object: PositionedObject, roll:number, pitch:number) {
    vec3.rotateZ(object.position, object.position, [0,0,0], roll)
    vec3.rotateX(object.position, object.position, [0,0,0], pitch)
}

export function move(object:PositionedObject, delta:vec3) {
    vec3.add(object.position, object.position, delta)
}