import { Game } from "../../model/game"
import { Resources } from "../../resources/resources"
import { AttitudeEnum, ShipRoleEnum } from "../../model/ShipInstance"
import { missileTactics } from "./missileTactics"
import { stationTactics } from "./stationTactics"
import { rockHermitTactics } from "./rockHermitTactics"
import { traderTactics } from "./traderTactics"
import { bountyHunterTactics } from "./bountyHunterTactics"
import { flyTowards, rollShipByNoticeableAmount, steerShip } from "./manouver"
import { thargonTactics } from "./thargonTactics"
import { ShipModelEnum } from "../../model/shipBlueprint"
import { anacondaTactics } from "./anacondaTactics"
import { considerFiringLasers, considerFiringMissile, considerLaunchingEscapePod } from "./weapons"
import { stationTacticsIntervalSeconds, tacticsIntervalSeconds } from "../../constants"

export function applyTactics(game: Game, resources: Resources, timeDelta: number) {
  // TODO: In the original game this operated on a couple of ships from the full set each
  // time through the game loop as outlined in the MVEIT routine:
  // https://www.bbcelite.com/cassette/main/subroutine/mveit_part_2_of_9.html
  //                         \ Fetch the slot number of the ship we are moving, EOR
  //  AND #7                 \ with the loop counter and apply mod 8 to the result.
  //  BNE MV30               \ The result will be zero when "counter mod 8" matches
  //                         \ the slot number mod 8, so this makes sure we call
  //                         \ TACTICS 12 times every 8 main loop iterations, like
  //                         \ this:
  //                         \
  //                         \   Iteration 0, apply tactics to slots 0 and 8
  //                         \   Iteration 1, apply tactics to slots 1 and 9
  //                         \   Iteration 2, apply tactics to slots 2 and 10
  //                         \   Iteration 3, apply tactics to slots 3 and 11
  //                         \   Iteration 4, apply tactics to slot 4
  //                         \   Iteration 5, apply tactics to slot 5
  //                         \   Iteration 6, apply tactics to slot 6
  //                         \   Iteration 7, apply tactics to slot 7
  //                         \   Iteration 8, apply tactics to slots 0 and 8
  //                         \     ...
  //                         \
  //                         \ and so on
  //
  // The percentages are in the tactics are largely based on the originals and assume the timing above.
  // Therefore we need a way of evaluating the tactics at approximately the same rate as the original game.
  // The original game has a highly variable framerate so the number of times through the main loop per second
  // varies massively.
  //
  // At the moment we run the tactics routine once a second for each ship.

  game.localBubble.ships.forEach((ship) => {
    ship.tacticsState.timeUntilNextStateChange -= timeDelta
    if (ship.tacticsState.timeUntilNextStateChange < 0) {
      ship.tacticsState.timeUntilNextStateChange =
        ship.role === ShipRoleEnum.Station ? stationTacticsIntervalSeconds : tacticsIntervalSeconds
      ship.tacticsState.canApplyTactics = true
      ship.energy = Math.min(ship.energy + 1, ship.blueprint.maxAiEnergy)
    }

    // we always evaluate trader tactics as their "tactic" is essentially become ai enabled in some scenarios
    if (ship.role === ShipRoleEnum.Trader) traderTactics(ship, game)
    if (!ship.aiEnabled) return

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
