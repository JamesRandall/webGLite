import {Game} from "../../model/game";
import {Resources} from "../../resources/resources";
import {Player} from "../../model/player";
import {vec3} from "gl-matrix";
import {move, rotateLocationInSpaceByPitchAndRoll, rotateOrientationVectorsByPitchAndRoll} from "./transforms";
import {worldSize} from "../../constants";

export function updateLocalBubbleOnLaunch(game:Game, resources:Resources) {
    game.localBubble.ships = []

    positionPlayerInOrbit(game)
    spawnSpaceStation(game, resources)
    launchPlayer(game.player)
}

function calculateSpaceStationRotationSpeed(player: Player) {
    return player.ship.maxRollSpeed/4
}

function spawnSpaceStation(game:Game, resources:Resources) {
    const station = resources.ships.getCoriolis([0,0,250], [0,0,-1])
    station.roll = calculateSpaceStationRotationSpeed(game.player)
    game.localBubble.ships.push(station)
}

function positionPlayerInOrbit(game: Game) {
    const planet = game.localBubble.planet
    const sun = game.localBubble.sun
    const player = game.player
    planet.radius = player.currentSystem.averageRadius // set the planets radius to that of the current system
    // to position the player in orbit what we actually do is move the world bubble so that the player is at
    // a distance of (planet radius * 2) from the planet and facing it
    // to do this we:
    //  1. Move the objects in the world such that the planet is at 0,0,0 along with the player.
    //     In reality we only need to move the sun and the star as we've cleared the ships array at the start of this process
    //  2. Apply a random pitch and roll to the player and move the objects accordingly.
    //     The player doesn't actually move - we just do that rotation as if they did
    //  3. Move the ships in the world such that the planet is at 0,0,-(planetradius*2)

    // Step 1
    const translateDelta = vec3.subtract(vec3.create(), [0,0,0], planet.position)
    move(planet,translateDelta)
    move(sun,translateDelta)

    // Step 2
    const randomRoll = Math.random()*Math.PI*2
    const randomPitch = Math.random()*Math.PI*2
    rotateLocationInSpaceByPitchAndRoll(sun, randomRoll, randomPitch)
    rotateOrientationVectorsByPitchAndRoll(sun, randomRoll, randomPitch)

    // Step 3 (we also reset the orientation as the planet will now be directly ahead of the player)
    move(planet,[0,0,-planet.radius*2])
    // The below puts us at approximately the right position after a hyperspace jump
    //move(planet,[0,0,-worldSize/(Math.random()*128 + 128)])
    planet.noseOrientation = [0,0,1]
    planet.roofOrientation = [0,1,0]
    planet.rightOrientation = [1,0,0]
}

function launchPlayer(player:Player) {
    player.isDocked = false
    player.speed = player.ship.maxSpeed * 0.25
    player.roll = calculateSpaceStationRotationSpeed(player)
}