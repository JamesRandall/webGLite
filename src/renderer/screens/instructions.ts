import { Primitives } from "../primitives/primitives"
import { Game } from "../../model/game"
import { frameColor, frameWidth } from "../../constants"
import { CombatRatingEnum, LaserTypeEnum, LegalStatusEnum } from "../../model/player"
import { drawHeader } from "./screenUtilities"
import { createTextRenderer } from "../primitives/text"
import { Resources } from "../../resources/resources"

export function createInstructionsRenderer(gl: WebGL2RenderingContext, resources: Resources, draw2d: Primitives) {
  const text = createTextRenderer(
    gl,
    gl.canvas.width,
    gl.canvas.height,
    false,
    resources,
    gl.canvas.height / 50,
    resources.textures.instructionsFont,
  )

  return function renderInventory(game: Game) {
    const player = game.player

    drawHeader(draw2d, "INSTRUCTIONS")

    let row = 3.5
    text.draw("A      fire", [1, row++])
    text.draw("S      dive", [1, row++])
    text.draw("X      climb", [1, row++])
    text.draw(",      roll left", [1, row++])
    text.draw(".      roll right", [1, row++])
    text.draw("/      decelerate", [1, row++])
    text.draw("SPACE  accelerate", [1, row++])
    text.draw("J      jump (hold)", [1, row++])
    text.draw("C      docking computer (on/off)", [1, row++])
    text.draw("H      hyperspace", [1, row++])
    text.draw("T      arm missile", [1, row++])
    text.draw("U      unarm missile", [1, row++])
    text.draw("M      fire missile", [1, row++])
    text.draw("E      ECM", [1, row++])
    text.draw("TAB    energy bomb", [1, row++])

    row++
    text.draw("1      front \\ launch", [1, row++])
    text.draw("2      rear \\ trade", [1, row++])
    text.draw("3      left \\ equipment", [1, row++])
    text.draw("4      right", [1, row++])
    text.draw("5      galactic map", [1, row++])
    text.draw("6      short range chart", [1, row++])
    text.draw("7      system details", [1, row++])
    text.draw("8      market prices", [1, row++])
    text.draw("9      player details", [1, row++])
    text.draw("0      inventory", [1, row++])
    text.draw("ARROWS cursor on charts", [1, row++])
    row++
    text.draw("[      previous visual effect", [1, row++])
    text.draw("]      next visual effect", [1, row++])
  }
}
