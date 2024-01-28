import { createPrimitiveRenderer } from "../primitives/primitives"
import { Resources } from "../../resources/resources"
import { setupGl } from "../common"
import { createTextRenderer } from "../primitives/text"
import { dimensions } from "../../constants"

export function createInstructionRenderer(gl: WebGL2RenderingContext, resources: Resources) {
  const text = createTextRenderer(
    gl,
    gl.canvas.width,
    gl.canvas.height,
    false,
    resources,
    800 / 60,
    resources.textures.instructionsFont,
  )
  return function renderInstructions(showHelpText: boolean) {
    setupGl(gl)
    if (showHelpText) {
      let row = 0
      text.draw("S      dive", [1, row++])
      text.draw("X      climb", [1, row++])
      text.draw(",      roll left", [1, row++])
      text.draw(".      roll right", [1, row++])
      text.draw("/      decelerate", [1, row++])
      text.draw("SPACE  accelerate", [1, row++])
      text.draw("J      jump (hold)", [1, row++])
      text.draw("C      docking computer (on/off)", [1, row++])
      text.draw("H      hyperspace", [1, row++])

      row++
      text.draw("1      front \\ launch", [1, row++])
      text.draw("2      rear \\ trade", [1, row++])
      text.draw("6      short range chart", [1, row++])
      text.draw("7      system details", [1, row++])
      text.draw("9      player details", [1, row++])
      text.draw("ARROWS cursor on charts", [1, row++])
      row++
      text.draw("[      previous effect", [1, row++])
      text.draw("]      next effect", [1, row++])
      text.draw("Q      toggle help", [1, row++])
    }
  }
}
