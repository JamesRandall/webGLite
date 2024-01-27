import { Game } from "../../model/game"
import { vec3 } from "gl-matrix"

type FlightPlanPositionProvider = (game: Game) => vec3
type FlightPlanManeuverStage = (game: Game, context: vec3, timeDelta: number) => boolean
type FlightPlanActionStage = (game: Game, context: vec3) => void
type FlightPlanStage = FlightPlanPositionProvider | FlightPlanManeuverStage | FlightPlanActionStage

function isFlightPlanPositionProviderStage(func: Function): func is FlightPlanPositionProvider {
  return func.length === 1
}
function isFlightPlanManeuverStage(func: Function): func is FlightPlanManeuverStage {
  return func.length === 3
}
function isFlightPlanActionStage(func: Function): func is FlightPlanActionStage {
  return func.length === 2
}

export function executeFlightPlan(game: Game, stages: FlightPlanStage[]) {
  const initialPositionVector = vec3.create()
  let currentStageIndex = 0
  let positionProvider: FlightPlanPositionProvider = (_: Game) => initialPositionVector
  let previousStageIndex = -1

  return function (game: Game, timeDelta: number) {
    if (currentStageIndex >= stages.length) return

    if (previousStageIndex != currentStageIndex) {
      console.log(stages[currentStageIndex].name)
      previousStageIndex = currentStageIndex
    }

    const stage = stages[currentStageIndex]
    if (isFlightPlanPositionProviderStage(stage)) {
      positionProvider = stage
      currentStageIndex++
    } else if (isFlightPlanManeuverStage(stage)) {
      const stageIsComplete = stage(game, positionProvider(game), timeDelta)
      if (stageIsComplete) {
        currentStageIndex++
      }
    } else if (isFlightPlanActionStage(stage)) {
      stage(game, positionProvider(game))
      currentStageIndex++
    }
  }
}
