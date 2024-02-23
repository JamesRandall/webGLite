import { AttitudeEnum, ShipInstance } from "../../model/ShipInstance"

export function aiFlag(player: ShipInstance) {
  // The original game stores various bits of info in a single byte but then also uses the total value of the byte in
  // various comparisons. To keep this code "modern" I've broken the flag out into properties (we're not exactly worrying
  // about performance and memory here!) but the original tactics routines use this value for various comparisons.
  // This function composes the original value from the properties
  return (
    (player.hasECM ? 1 : 0) |
    ((player.aggressionLevel & 31) << 1) |
    (player.attitude === AttitudeEnum.Hostile ? 64 : 0) |
    (player.aiEnabled ? 128 : 0)
  )
}
