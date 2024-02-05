import { Game } from "../model/game"
import { Resources } from "../resources/resources"
import { AttitudeEnum, ShipRoleEnum } from "../model/ShipInstance"
import { missileTactics } from "./missileTactics"
import { stationTactics } from "./stationTactics"
import { rockHermitTactics } from "./rockHermitTactics"
import { traderTactics } from "./traderTactics"
import { bountyHunterTactics } from "./bountyHunterTactics"
import { flyTowards } from "./manouver"
import { thargonTactics } from "./thargonTactics"

export function applyTactics(game: Game, resources: Resources, timeDelta: number) {
  // TODO: In the original game this operated on a couple of ships from the full set each
  // time through the game loop. The percentages are all based on that. When I have the logic
  // time need to rework this outer part a little so that it approximates the original else
  // the world will be rather hectic

  game.localBubble.ships.forEach((ship) => {
    ship.energy = Math.min(ship.energy + 1, ship.blueprint.maxAiEnergy)

    switch (ship.role) {
      // This is tactics part 2 of 7
      // https://www.bbcelite.com/master/main/subroutine/tactics_part_2_of_7.html
      case ShipRoleEnum.Missile:
        missileTactics(ship, game, resources, timeDelta)
        break
      case ShipRoleEnum.Station:
        stationTactics(ship, game, resources)
        break
      case ShipRoleEnum.RockHermit:
        rockHermitTactics(ship, game, resources)
        break
      // This is tactics part 3 of 7
      // https://www.bbcelite.com/master/main/subroutine/tactics_part_3_of_7.html
      case ShipRoleEnum.Thargon:
        thargonTactics(ship, game, resources)
        break
      case ShipRoleEnum.Trader:
        traderTactics(ship, game)
        break
      case ShipRoleEnum.BountyHunter:
        bountyHunterTactics(ship, game)
        break
    }
    // TODO: some ships might be docking and we have to handle that here if so
    if (ship.attitude === AttitudeEnum.Friendly) {
      flyTowards(ship, game.localBubble.planet.position)
    }
    if (ship.attitude === AttitudeEnum.Hostile && ship.role === ShipRoleEnum.Pirate && game.player.isInSafeZone) {
      ship.aggressionLevel = 0
    }
    // Tactics part 4 of 7
    // https://www.bbcelite.com/master/main/subroutine/tactics_part_4_of_7.html
    // TODO !
  })
}
