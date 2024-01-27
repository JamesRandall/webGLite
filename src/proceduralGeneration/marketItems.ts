import { StarSystem } from "../model/starSystem"

const marketItemBaseStats = [
  // The source for this can be found here: https://www.bbcelite.com/master/main/variable/qq23.html
  { name: "Food", price: 19, economicFactor: -2, unit: "t", quantity: 6, mask: 0b00000001 },
  { name: "Textiles", price: 20, economicFactor: -1, unit: "t", quantity: 10, mask: 0b00000011 },
  { name: "Radioactives", price: 65, economicFactor: -3, unit: "t", quantity: 2, mask: 0b00000111 },
  { name: "Slaves", price: 40, economicFactor: -5, unit: "t", quantity: 226, mask: 0b00011111 },
  { name: "Liquor/Wines", price: 83, economicFactor: -5, unit: "t", quantity: 251, mask: 0b00001111 },
  { name: "Luxuries", price: 196, economicFactor: 8, unit: "t", quantity: 54, mask: 0b00000011 },
  { name: "Narcotics", price: 235, economicFactor: 29, unit: "t", quantity: 8, mask: 0b01111000 },
  { name: "Computers", price: 154, economicFactor: 14, unit: "t", quantity: 56, mask: 0b00000011 },
  { name: "Machinery", price: 117, economicFactor: 6, unit: "t", quantity: 40, mask: 0b00000111 },
  { name: "Alloys", price: 78, economicFactor: 1, unit: "t", quantity: 17, mask: 0b00011111 },
  { name: "Firearms", price: 124, economicFactor: 13, unit: "t", quantity: 29, mask: 0b00000111 },
  { name: "Furs", price: 176, economicFactor: -9, unit: "t", quantity: 220, mask: 0b00111111 },
  { name: "Minerals", price: 32, economicFactor: -1, unit: "t", quantity: 53, mask: 0b00000011 },
  { name: "Gold", price: 97, economicFactor: -1, unit: "kg", quantity: 66, mask: 0b00000111 },
  { name: "Platinum", price: 171, economicFactor: -2, unit: "kg", quantity: 55, mask: 0b00011111 },
  { name: "Gem-Stones", price: 45, economicFactor: -1, unit: "g", quantity: 250, mask: 0b00001111 },
  { name: "Alien items", price: 53, economicFactor: 15, unit: "t", quantity: 0, mask: 0b00000111 },
]

export interface MarketItem {
  name: string
  unit: string
  unitPrice: number
  quantityForSale: number
}

// The algorithm for this is described here:
//    https://www.bbcelite.com/deep_dives/market_item_prices_and_availability.html
// TODO: the implementation below is not entirely accurate. The original uses 8-bit arithmetic (essentially on a single
// byte) which results in Narcotics, with their high economic factor taking calculations above 255 - in the original
// code this results in the carry flag being set and used in various places. In the below... it does not.
export function generateMarketItems(system: StarSystem): MarketItem[] {
  const random = () => Math.floor(Math.random() * 256)

  return marketItemBaseStats.map((base) => {
    const unitPrice = ((base.price + (random() & base.mask) + system.economy * base.economicFactor) * 4) / 10
    //const unitPrice = ((((base.price + (random() & base.mask) + system.economy)) * base.economicFactor) * 4)/10
    const quantityForSale = Math.max(
      0,
      (base.quantity + (random() & base.mask) - system.economy * base.economicFactor) % 64,
    )
    return {
      name: base.name,
      unit: base.unit,
      unitPrice,
      quantityForSale,
    }
  })
}
