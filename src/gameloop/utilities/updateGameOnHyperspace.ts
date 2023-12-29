import {Game} from "../../model/game";
import {Resources} from "../../resources/resources";
import {vec2, vec3} from "gl-matrix";
import {move} from "./transforms";
import {worldSize} from "../../constants";

export function updateGameOnHyperspace(game:Game, resources:Resources) {
    const distance = vec2.distance(game.player.currentSystem.galacticPosition, game.player.selectedSystem.galacticPosition)
    game.player.fuel = Math.max(0, game.player.fuel - Math.floor(distance*10))
    game.hyperspace = null
    game.player.currentSystem = game.player.selectedSystem

    positionPlayerAwayFromPlanet(game)
}

function positionPlayerAwayFromPlanet(game:Game) {
    const planet = game.localBubble.planet
    const sun = game.localBubble.sun
    const player = game.player
    planet.radius = player.currentSystem.averageRadius

    // create a random directional vector for the planet then move it to a random distance suitable for hyperspace
    // exit along that vector
    const planetDirectionVector = vec3.normalize(vec3.create(),[Math.random()*2-1,Math.random()*2-1,Math.random()*2-1])
    const distance = -worldSize/(Math.random()*128 + 128)
    const planetPosition = vec3.multiply(vec3.create(),planetDirectionVector,[distance,distance,distance])
    // orient it to the player
    const planetNoseOrientation = vec3.multiply(vec3.create(), planetDirectionVector,[-1,-1,-1])
    const planetRoofOrientation = vec3.rotateX(vec3.create(), planetNoseOrientation, [0,0,0], 90 * Math.PI/180)


    planet.position = planetPosition
    planet.noseOrientation = planetNoseOrientation
    planet.roofOrientation = planetRoofOrientation
}