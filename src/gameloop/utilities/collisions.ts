import {ShipInstance} from "../../model/ShipInstance";
import {vec2, vec3} from "gl-matrix";
import {getConstraints} from "../../utilities";
import {Game} from "../../model/game";
import {calculateRotation} from "./transforms";

export function isInRotatedBox(
    position: vec3,
    noseOrientation:vec3,
    roofOrientation:vec3,
    sideOrientation:vec3,
    boxSize:vec3) {
    // if we're inside the bounding box then do the final check - does the actual rotated bounding box of the
    // ship contain the position of the player
    // we figure this out by first calcualting the players position relative to the ship (this is the inverse
    // of the position of the ship), then we rotate that point by the inverse of the rotation of the ship.
    // Now we have a position that is in the same co-ordinate system as the un-rotated bounding box of the ship
    // and we can check to see if that overlaps the position
    //
    // TODO: If we do this I'm not sure its worth maintaining the axis aligned bounding boxes in realtime...
    // we should probably just set them to the maximum possible extent when we load the model.
    //
    // TODO: I'm not convinced this is correct - need to do some unit tests

    const [noseAngleRadians, roofAngleRadians, sideAngleRadians] =
        calculateRotation(noseOrientation, roofOrientation, sideOrientation)
    const rotatedPlayerPosition = vec3.copy(vec3.create(), position)
    vec3.rotateZ(rotatedPlayerPosition, rotatedPlayerPosition, [0,0,0], -noseAngleRadians)
    vec3.rotateY(rotatedPlayerPosition, rotatedPlayerPosition, [0,0,0], -roofAngleRadians)
    vec3.rotateX(rotatedPlayerPosition, rotatedPlayerPosition, [0,0,0], -sideAngleRadians)
    const isInShipBox =
        rotatedPlayerPosition[0] >= -(boxSize[0]/2) &&
        rotatedPlayerPosition[0] <= (boxSize[0]/2) &&
        rotatedPlayerPosition[1] >= -(boxSize[1]/2) &&
        rotatedPlayerPosition[1] <= (boxSize[1]/2) &&
        rotatedPlayerPosition[2] >= -(boxSize[2]/2) &&
        rotatedPlayerPosition[2] <= (boxSize[2]/2)
    //if (isInShipBox) {
    //    console.log(`RPP: ${rotatedPlayerPosition}`)
    //    console.log(`BS: ${shipInstance.blueprint.model.boundingBoxSize}`)
    //}
    return isInShipBox
}

export function isShipCollidingWithPlayer(shipInstance: ShipInstance) {
    const boundingBoxSize = shipInstance.blueprint.model.boundingBoxSize
    const largestAxis = Math.max(boundingBoxSize[0], boundingBoxSize[1], boundingBoxSize[2])
    const shipDistance = vec3.length(shipInstance.position)
    // start with a range check, I believe this is all the original game does and in a super efficient way with just a
    // high byte not zero check, which makes sense given the constraints of the hardware
    // we use a range check just to determine if we need to do a more precise check
    // an improvement here would be to calculate the maximum distance of the bounding box rather than this fudged
    // approximation - the largest distance is from the center of the cube to one of the corners
    if (shipDistance <= largestAxis*2) {
        // then do an axis aligned bounding box check
        const axisAlignedBoundingBoxConstraints = getConstraints(shipInstance.boundingBox)
        // the bounding box is centered on 0,0,0 so rather than check the player against the box we check
        // the ships position against the box - its the same check in reverse if that makes sense!
        const position = shipInstance.position
        const isInBox =
            position[0] >= axisAlignedBoundingBoxConstraints.min[0] &&
            position[0] <= axisAlignedBoundingBoxConstraints.max[0] &&
            position[1] >= axisAlignedBoundingBoxConstraints.min[1] &&
            position[1] <= axisAlignedBoundingBoxConstraints.max[1] &&
            position[2] >= axisAlignedBoundingBoxConstraints.min[2] &&
            position[2] <= axisAlignedBoundingBoxConstraints.max[2]
        if (isInBox) {
            return isInRotatedBox(shipInstance.position,
                shipInstance.noseOrientation,
                shipInstance.roofOrientation,
                shipInstance.rightOrientation,
                shipInstance.blueprint.model.boundingBoxSize)
        }
        return false
        // there is room for future improvement here - we could do a separating axis type test against the rotated
        // box rather than the axis aligned box or, if we want to be really precise, against the exact shape of the
        // ship (they are all convex so shouldn't be too hardto do)
        // however because the player has no real visible presence in the game world it doesn't need to be 100% accurate
        // it just needs to feel fair
    }
    return false
}

function isValidDockingApproach(game: Game) {
    if (game.localBubble.station === null) return false
    const station = game.localBubble.station

    const dockingPortLocationRelativeToStationCenter =
        // the docking port is on the surface of the face that the nose orientation intersects (i.e. the nose
        // orientation points in the direction of the docking port) and is located half the depth of the station
        // from its center
        vec3.multiply(vec3.create(), station.noseOrientation, [0,0,station.blueprint.model.boundingBoxSize[2]/2])
    const dockingPortLocationRelativeToPlayer =
        vec3.add(vec3.create(), dockingPortLocationRelativeToStationCenter, station.position)


    const dotProduct = vec3.dot([1,0,0], station.roofOrientation)
    return dotProduct > 0.9
}