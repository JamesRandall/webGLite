import {Player} from "../model/player";
import {mat4, quat, vec3} from "gl-matrix";
import {worldToViewRatio} from "../constants";
import {ShipInstance} from "../model/ShipInstance";

// Based on this game loop: https://www.bbcelite.com/deep_dives/program_flow_of_the_ship-moving_routine.html
export function updateShipInstance(shipInstance: ShipInstance, player: Player, timeDelta: number) {
    applyTactics(shipInstance)
    moveShipBySpeed(shipInstance, timeDelta)
    applyAcceleration(shipInstance, timeDelta)
    rotateLocationInSpaceByPlayerPitchAndRoll(shipInstance, player, timeDelta)
    moveShipByPlayerSpeed(shipInstance, player, timeDelta)
    rotateOrientationVectorsAccordingToPlayerPitchAndRoll(shipInstance, player, timeDelta)
    rotateShipByPitchAndRoll(shipInstance, timeDelta)
}

function applyTactics(shipInstance: ShipInstance) {
    // update the ships tactics
}

function moveShipBySpeed(shipInstance:ShipInstance, timeDelta:number) {
    // move the ship by its speed along its orientation vector
}

function applyAcceleration(shipInstance: ShipInstance, timeDelta:number) {
    // apply acceleration if required and then zero acceleration as its a one off operation
}

function rotateLocationInSpaceByPlayerPitchAndRoll(shipInstance: ShipInstance, player: Player, timeDelta:number) {
    vec3.rotateZ(shipInstance.position, shipInstance.position, [0,0,0], player.roll * timeDelta)
    vec3.rotateX(shipInstance.position, shipInstance.position, [0,0,0], player.pitch * timeDelta)
}

function moveShipByPlayerSpeed(shipInstance: ShipInstance, player: Player, timeDelta:number) {
    vec3.add(shipInstance.position, shipInstance.position, vec3.divide(vec3.create(),[0,0,player.speed*timeDelta],worldToViewRatio))
}

function rotateOrientationVectorsAccordingToPlayerPitchAndRoll(shipInstance: ShipInstance, player: Player, timeDelta:number) {
    vec3.rotateZ(shipInstance.noseOrientation, shipInstance.noseOrientation, [0,0,0], player.roll * timeDelta)
    vec3.rotateZ(shipInstance.roofOrientation, shipInstance.roofOrientation, [0,0,0], player.roll * timeDelta)
    //vec3.rotateZ(shipInstance.rightOrientation, shipInstance.rightOrientation, [0,0,0], player.roll * timeDelta)
    vec3.rotateX(shipInstance.noseOrientation, shipInstance.noseOrientation, [0,0,0], player.pitch * timeDelta)
    vec3.rotateX(shipInstance.roofOrientation, shipInstance.roofOrientation, [0,0,0], player.pitch * timeDelta)
    //vec3.rotateX(shipInstance.rightOrientation, shipInstance.rightOrientation, [0,0,0], player.pitch * timeDelta)
    vec3.normalize(shipInstance.noseOrientation,shipInstance.noseOrientation)
    vec3.normalize(shipInstance.roofOrientation,shipInstance.roofOrientation)
}

function rotateShipByPitchAndRoll(shipInstance: ShipInstance, timeDelta:number) {
    // For roll we need to rotate our roof axis and right axis around our nose orientation
    const rollRotationMatrix = mat4.create()
    mat4.rotate(rollRotationMatrix, rollRotationMatrix, shipInstance.roll * timeDelta, shipInstance.noseOrientation)
    // For pitch we need to rotate our nose axis and roof axis around the right axis
    const pitchRotationMatrix = mat4.create()
    mat4.rotate(pitchRotationMatrix, pitchRotationMatrix, shipInstance.pitch * timeDelta, shipInstance.rightOrientation)

    vec3.transformMat4(shipInstance.roofOrientation, shipInstance.roofOrientation, rollRotationMatrix)
    vec3.transformMat4(shipInstance.rightOrientation, shipInstance.rightOrientation, rollRotationMatrix)

    vec3.transformMat4(shipInstance.noseOrientation, shipInstance.noseOrientation, pitchRotationMatrix)
    vec3.transformMat4(shipInstance.roofOrientation, shipInstance.roofOrientation, pitchRotationMatrix)

    vec3.normalize(shipInstance.noseOrientation,shipInstance.noseOrientation)
    vec3.normalize(shipInstance.roofOrientation,shipInstance.roofOrientation)
    vec3.normalize(shipInstance.rightOrientation,shipInstance.rightOrientation)
}
