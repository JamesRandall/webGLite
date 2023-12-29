import {Game} from "../../model/game";
import {vec2} from "gl-matrix";
import {StarSystem} from "../../model/starSystem";

export function getNearestSystemToCursor(game: Game) {
    const result = game.stars.reduce((memo, star) => {
        const thisDistance = vec2.distance(game.player.scannerCursor, star.galacticPosition)
        if (thisDistance < memo.distance) {
            return { star: star, distance: thisDistance }
        }
        return memo
    }, { star: null as StarSystem | null, distance: 1000})
    return result.star!
}