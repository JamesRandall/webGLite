import { Game } from "../model/game"
import { Resources } from "../resources/resources"
import { AttitudeEnum, ShipRoleEnum } from "../model/ShipInstance"
import { missileTactics } from "./missileTactics"
import { stationTactics } from "./stationTactics"
import { rockHermitTactics } from "./rockHermitTactics"
import { traderTactics } from "./traderTactics"
import { bountyHunterTactics } from "./bountyHunterTactics"
import { flyTowards, rollShipByNoticeableAmount, steerShip } from "./manouver"
import { thargonTactics } from "./thargonTactics"
import { ShipModelEnum } from "../model/shipBlueprint"
import { anacondaTactics } from "./anacondaTactics"
import { considerFiringLasers, considerFiringMissile, considerLaunchingEscapePod } from "./weapons"
import { stationTacticsFrequencySeconds, tacticsFrequencySeconds } from "../constants"

export function applyTactics(game: Game, resources: Resources, timeDelta: number) {
  // TODO: In the original game this operated on a couple of ships from the full set each
  // time through the game loop. The percentages are all based on that. When I have the logic
  // time need to rework this outer part a little so that it approximates the original else
  // the world will be rather hectic

  game.localBubble.ships.forEach((ship) => {
    ship.energy = Math.min(ship.energy + 1, ship.blueprint.maxAiEnergy)
    ship.tacticsState.timeUntilNextStateChange -= timeDelta
    if (ship.tacticsState.timeUntilNextStateChange < 0) {
      ship.tacticsState.timeUntilNextStateChange =
        ship.role === ShipRoleEnum.Station ? stationTacticsFrequencySeconds : tacticsFrequencySeconds
      ship.tacticsState.canApplyTactics = true
    }

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
    if (ship.blueprint.model === ShipModelEnum.Anaconda) {
      anacondaTactics(ship, game, resources)
    }
    // Original game uses this percentage but its based on its loop timing system
    // if (Math.random() < 0.0025) {
    if (Math.random() < 0.05) {
      rollShipByNoticeableAmount(ship)
    }
    if (ship.energy > ship.blueprint.maxAiEnergy / 2) {
      // Tactics part 5 of 7
      // https://www.bbcelite.com/master/main/subroutine/tactics_part_5_of_7.html
      considerFiringLasers(ship, timeDelta, game, resources)
    } else if (ship.energy > ship.blueprint.maxAiEnergy / 8) {
      // Tactics part 6 of 7
      // https://www.bbcelite.com/master/main/subroutine/tactics_part_6_of_7.html
      considerFiringMissile(ship, game, resources)
    } else {
      if (ship.hasEscapePod) {
        // A bit more from tactics part 4 of 7
        // https://www.bbcelite.com/master/main/subroutine/tactics_part_4_of_7.html
        considerLaunchingEscapePod(ship, game, resources)
      }
    }
    // Tactics part 7 of 7
    // https://www.bbcelite.com/master/main/subroutine/tactics_part_7_of_7.html
    steerShip(ship, game, timeDelta)

    ship.tacticsState.canApplyTactics = false
  })
}
