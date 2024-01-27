import { ProceduralSeed } from "./seeds"

const size = ["Large", "Fierce", "Small"]

const adjective = ["Green", "Red", "Yellow", "Blue", "Black", "Harmless"]

const style = ["Slimy", "Bug-Eyed", "Horned", "Bony", "Fat", "Furry"]

const type = ["Rodents", "Frogs", "Lizards", "Lobsters", "Birds", "Humanoids", "Felines", "Insects"]

export function getSpecies(seed: ProceduralSeed) {
  if (!seed.s2_lo.isBitSet(7)) {
    return "Human Colonials"
  }
  const components: string[] = []
  const sizeIndex = seed.s2_hi.getBitRange(2, 3)
  if (sizeIndex < size.length) {
    components.push(size[sizeIndex])
  }
  const adjectiveIndex = seed.s2_hi.getBitRange(5, 3)
  if (adjectiveIndex < adjective.length) {
    components.push(adjective[adjectiveIndex])
  }
  const styleIndex = (seed.s0_hi ^ seed.s1_hi).getBitRange(0, 3)
  if (styleIndex < style.length) {
    components.push(style[styleIndex])
  }
  const typeIndex = (seed.s2_hi.getBitRange(0, 2) + styleIndex).getBitRange(0, 3)
  components.push(type[typeIndex])

  return components.join(" ")
}
