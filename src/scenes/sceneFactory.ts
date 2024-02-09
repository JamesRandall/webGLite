import { Resources } from "../resources/resources"
import { createGameScene } from "./gameScene"
import { RenderEffect } from "../renderer/rootRenderer"
import { createPregameScene } from "./pregameScene"
import { ShipModelEnum } from "../model/shipBlueprint"
import { createTestScene } from "./testScene"
import { scannerRadialWorldRange } from "../constants"

export enum StartingSceneEnum {
  Pregame,
  Docked,
  NamedScene,
}

const sceneMap = new Map([["trader", soloTrader]])

export function createStartingScene(
  scene: StartingSceneEnum,
  resources: Resources,
  gl: WebGL2RenderingContext,
  namedScene: string | null,
) {
  switch (scene) {
    case StartingSceneEnum.Docked:
      return createGameScene(resources, gl, RenderEffect.None)
    case StartingSceneEnum.NamedScene:
      // eventually be good to let scenes be loaded from JSON but for now we'll just use a function map
      const ships = sceneMap.get(namedScene!)!(resources)
      return createTestScene(resources, gl, ships)
    case StartingSceneEnum.Pregame:
    default:
      return createPregameScene(resources, gl)
  }
}

function soloTrader(resources: Resources) {
  const trader = resources.ships.getInstanceOfModel(
    ShipModelEnum.CobraMk3,
    [0, 0, -scannerRadialWorldRange[2] / 3],
    [0, 0, 1],
  )
  return [trader]
}
