import { Resources } from "../resources/resources"
import { createGameScene } from "./gameScene"
import { RenderEffect } from "../renderer/rootRenderer"
import { createPregameScene } from "./pregameScene"
import { ShipModelEnum } from "../model/shipBlueprint"
import { createTestScene } from "./testScene"
import { scannerRadialWorldRange } from "../constants"
import { AttitudeEnum, ShipRoleEnum } from "../model/ShipInstance"

export enum StartingSceneEnum {
  Pregame,
  Docked,
  NamedScene,
}

const sceneMap = new Map([
  ["trader", soloTrader],
  ["pirate", soloPirate],
  ["pirates", pirateGroup],
])

export function createStartingScene(
  scene: StartingSceneEnum,
  resources: Resources,
  gl: WebGL2RenderingContext,
  namedScene: string | null,
) {
  switch (scene) {
    case StartingSceneEnum.Docked:
      return createGameScene(resources, gl, null)
    case StartingSceneEnum.NamedScene:
      // eventually be good to let scenes be loaded from JSON but for now we'll just use a function map
      const ships = sceneMap.get(namedScene ?? "trader")!(resources)
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

function soloPirate(resources: Resources) {
  const pirate = resources.ships.getInstanceOfModel(
    ShipModelEnum.Python,
    [0, 0, -scannerRadialWorldRange[2] / 4],
    [0, 0, 1],
  )
  pirate.role = ShipRoleEnum.Pirate
  pirate.aiEnabled = true
  pirate.aggressionLevel = 28
  pirate.attitude = AttitudeEnum.Hostile
  //pirate.speed = pirate.blueprint.maxSpeed / 2
  return [pirate]
}

function pirateGroup(resources: Resources) {
  const pirate1 = resources.ships.getInstanceOfModel(
    ShipModelEnum.Python,
    [-scannerRadialWorldRange[2] / 4, scannerRadialWorldRange[2] / 4, -scannerRadialWorldRange[2] / 4],
    [0, 0, 1],
  )
  pirate1.role = ShipRoleEnum.Pirate
  pirate1.aiEnabled = true
  pirate1.aggressionLevel = 28
  pirate1.attitude = AttitudeEnum.Hostile

  const pirate2 = resources.ships.getInstanceOfModel(
    ShipModelEnum.Krait,
    [scannerRadialWorldRange[2] / 4, -scannerRadialWorldRange[2] / 4, -scannerRadialWorldRange[2] / 4],
    [0, 0, 1],
  )
  pirate2.role = ShipRoleEnum.Pirate
  pirate2.aiEnabled = true
  pirate2.aggressionLevel = 28
  pirate2.attitude = AttitudeEnum.Hostile

  const pirate3 = resources.ships.getInstanceOfModel(
    ShipModelEnum.Mamba,
    [scannerRadialWorldRange[2] / 4, scannerRadialWorldRange[2] / 4, -scannerRadialWorldRange[2] / 4],
    [0, 0, 1],
  )
  pirate3.role = ShipRoleEnum.Pirate
  pirate3.aiEnabled = true
  pirate3.aggressionLevel = 28
  pirate3.attitude = AttitudeEnum.Hostile

  //pirate.speed = pirate.blueprint.maxSpeed / 2
  return [pirate1, pirate2, pirate3]
}
