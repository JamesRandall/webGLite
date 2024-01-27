import { createPrimitiveRenderer } from "../primitives/primitives"
import { Resources } from "../../resources/resources"
import { setupGl } from "../common"
import { createTextRenderer } from "../primitives/text"
import { dimensions } from "../../constants"

export function createInstructionRenderer(gl: WebGL2RenderingContext, resources: Resources) {
  const text = createTextRenderer(gl, gl.canvas.width, gl.canvas.height, false, resources, 800 / 40)
  return function renderInstructions(showHelpText: boolean) {
    setupGl(gl)
    if (showHelpText) {
      text.draw("S - dive", [1, 0])
      text.draw("X - climb", [1, 1])
      text.draw(", - roll left", [1, 2])
      text.draw(". - roll right", [1, 3])
      text.draw("/ - decelerate", [1, 4])
      text.draw("SPACE - accelerate", [1, 5])
      text.draw("J - jump", [1, 6])
      text.draw("C - docking computer", [1, 7])
      text.draw("1 - front \\ launch", [1, 8])
      text.draw("2 - rear \\ trade", [1, 9])
      //text.draw("3 - right\\equipment", [1, 10])

      text.draw("MISC", [1, 25])
      text.draw("[ - previous effect", [1, 27])
      text.draw("] - next effect", [1, 28])
      text.draw("H - toggle help", [1, 29])
    }
  }
}
