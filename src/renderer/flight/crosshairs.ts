import { Primitives } from "../primitives/primitives"
import { Game, getLaserMountForScene, SceneEnum } from "../../model/game"
import { LaserTypeEnum } from "../../model/player"
import { dimensions, frameColor, frameWidth } from "../../constants"

export function drawCrosshairs(draw2d: Primitives, game: Game) {
  if (
    game.currentScene !== SceneEnum.Front &&
    game.currentScene !== SceneEnum.Rear &&
    game.currentScene !== SceneEnum.Left &&
    game.currentScene !== SceneEnum.Right
  )
    return
  const laserType = game.player.equipment.lasers.get(getLaserMountForScene(game.currentScene))
  if (laserType === undefined || laserType === LaserTypeEnum.None) return

  const centerX = dimensions.width / 2
  const centerY = dimensions.mainViewHeight / 2
  draw2d.rect(
    [centerX, centerY - dimensions.crosshairSpace - dimensions.crosshairLength],
    [frameWidth, dimensions.crosshairLength],
    frameColor,
  )
  draw2d.rect([centerX, centerY + dimensions.crosshairSpace], [frameWidth, dimensions.crosshairLength], frameColor)
  draw2d.rect(
    [centerX - dimensions.crosshairSpace - dimensions.crosshairLength, centerY],
    [dimensions.crosshairLength, frameWidth],
    frameColor,
  )
  draw2d.rect([centerX + dimensions.crosshairSpace, centerY], [dimensions.crosshairLength, frameWidth], frameColor)
}
