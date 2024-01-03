import {Game} from "../../model/game";
import {Resources} from "../../resources/resources";
import {vec2, vec3} from "gl-matrix";
import {move, rotateLocationInSpaceByPitchAndRoll, rotateOrientationVectorsByPitchAndRoll} from "./transforms";
import {worldSize} from "../../constants";
import {generateMarketItems} from "../../proceduralGeneration/marketItems";

export function updateGameOnHyperspace(game:Game, resources:Resources) {
    const distance = vec2.distance(game.currentSystem.galacticPosition, game.player.selectedSystem.galacticPosition)
    game.player.fuel = Math.max(0, game.player.fuel - Math.floor(distance*10))
    game.hyperspace = null
    game.currentSystem = game.player.selectedSystem
    game.localBubble.ships = []
    game.localBubble.station =  null

    positionPlayerAwayFromPlanet(game)
    positionSun(game)
    game.marketItems = generateMarketItems(game.currentSystem)
}

// TODO: come back to the below when fresher, I've a horrible feeling its nonsense

function positionPlayerAwayFromPlanet(game:Game) {
    const planet = game.localBubble.planet
    const player = game.player
    planet.radius = game.currentSystem.averageRadius

    // create a random directional vector for the planet then move it to a random distance suitable for hyperspace
    // exit along that vector
    // we place the planet roughly in front of the player
    const planetDirectionVector = vec3.normalize(vec3.create(),[Math.random()*2-1,Math.random()*2-1,Math.random()-1])
    const approximateDistance = worldSize/(Math.random()*192 + 96)
    const planetPosition = vec3.multiply(vec3.create(),planetDirectionVector,[approximateDistance,approximateDistance,approximateDistance])
    // orient it to the player
    const planetNoseOrientation = vec3.multiply(vec3.create(), planetDirectionVector,[-1,-1,-1])
    const planetRoofOrientation = vec3.rotateX(vec3.create(), planetNoseOrientation, [0,0,0], 90 * Math.PI/180)
    const planetRightOrientation = vec3.rotateY(vec3.create(), planetNoseOrientation, [0,0,0], 90 * Math.PI/180)

    planet.position = planetPosition
    planet.noseOrientation = planetNoseOrientation
    planet.roofOrientation = planetRoofOrientation
    planet.rightOrientation = planetRightOrientation
    planet.pitch = 0.01
    planet.roll = 0.02
    planet.surfaceTextureIndex = game.currentSystem.surfaceTextureIndex
}

function positionSun(game:Game) {
    const sun = game.localBubble.sun

    // roughly behind the player
    sun.position = vec3.fromValues(0,0,worldSize+1000)
    sun.noseOrientation = vec3.fromValues(0,0,1)
    sun.roofOrientation = vec3.fromValues(0,1,0)
    sun.rightOrientation = vec3.fromValues(1,0,0)

    const randomPitch = Math.random() * (45 * (Math.PI/180))
    const randomRoll = Math.random() * (45 * (Math.PI/180))
    rotateLocationInSpaceByPitchAndRoll(sun, randomRoll, randomPitch)
    rotateOrientationVectorsByPitchAndRoll(sun, randomRoll, randomPitch)

    game.localBubble.sun.initialOrientation =
        vec3.normalize(
            vec3.create(),
            vec3.subtract(vec3.create(), game.localBubble.planet.position, game.localBubble.sun.position))
}