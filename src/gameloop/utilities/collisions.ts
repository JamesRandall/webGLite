import {ShipInstance} from "../../model/ShipInstance";
import {vec3} from "gl-matrix";
import {getConstraints} from "../../utilities";

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
        return isInBox
        // there is room for future improvement here - we could do a separating axis type test against the rotated
        // box rather than the axis aligned box or, if we want to be really precise, against the exact shape of the
        // ship (they are all convex so shouldn't be too hardto do)
        // however because the player has no real visible presence in the game world it doesn't need to be 100% accurate
        // it just needs to feel fair
    }
    return false
}
