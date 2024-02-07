import { ShipInstance } from "../model/ShipInstance"
import { vec3 } from "gl-matrix"
import { Game } from "../model/game"
import { scannerRadialWorldRange } from "../constants"

function isFarAway(ship:ShipInstance) {
  return vec3.length(ship.position) > (scannerRadialWorldRange[0] / 2)
}

export function flyTowards(ship: ShipInstance, position: vec3) {}

export function rollShipByNoticeableAmount(ship: ShipInstance) {}

export function steerShip(ship: ShipInstance, game: Game) {
  if ()
}
