import {loadShipSpecifications, ShipBlueprint} from "../model/shipBlueprint";
import {vec3} from "gl-matrix";
import {ShipInstance, ShipRoleEnum} from "../model/ShipInstance";
import {loadTexture} from "./texture";

export interface MarketItem {
    name: string
    basePrice: number
    economicFactor: number
    unit: string
    baseQuantity: number
    mask: number
}

export interface Resources {
    ships: {
        numberOfShips: number,
        getRandomShip: () => ShipBlueprint,
        getIndexedShip: (index:number, position: vec3, noseOrientation: vec3) => ShipInstance
        getCobraMk3: (position: vec3, noseOrientation: vec3) => ShipInstance,
        getThargoid: (position: vec3, noseOrientation: vec3) => ShipInstance,
        getCoriolis: (position: vec3, noseOrientation: vec3) => ShipInstance
    },
    textures: {
        planets: WebGLTexture[]
    }
    marketItems: MarketItem[]
}

export async function loadResources(gl:WebGLRenderingContext) : Promise<Resources> {
    const ships = await loadShipSpecifications(gl)
    return {
        ships: {
            numberOfShips: ships.length,
            getRandomShip: () => getRandomShip(ships),
            getIndexedShip: (index:number, position: vec3, noseOrientation: vec3) => toInstance(ships[index], position, noseOrientation),
            getCobraMk3: (position: vec3, noseOrientation: vec3) => getNamedShip(ships, 'Cobra Mk III', position, noseOrientation),
            getThargoid: (position: vec3, noseOrientation: vec3) => getNamedShip(ships, 'Thargoid', position, noseOrientation, ShipRoleEnum.Thargoid),
            getCoriolis: (position: vec3, noseOrientation: vec3) => getNamedShip(ships, 'Coriolis', position, noseOrientation, ShipRoleEnum.Station)
        },
        textures: {
            planets: [
                "./mars.png",
                "./neptune.png",
                "./venusSurface.png",
                "./venusAtmosphere.png",
                "./saturn.png",
                "./uranus.png",
                "./mercury.png",
                "./moon.png",
                "./ceres.png",
                "./eris.png",
                "./haumea.png",
                "./makemake.png"
            ].map(t => loadTexture(gl, t)!)
        },
        marketItems: [
            { name: 'Food',  basePrice: 19, economicFactor: -2, unit: 't', baseQuantity: 6, mask: 0b00000001 },
            { name: 'Textiles',  basePrice: 20, economicFactor: -1, unit: 't', baseQuantity: 10, mask: 0b00000011 },
            { name: 'Radioactives',  basePrice: 65, economicFactor: -3, unit: 't', baseQuantity: 2, mask: 0b00000111 },
            { name: 'Slaves',  basePrice: 40, economicFactor: -5, unit: 't', baseQuantity: 226, mask: 0b00011111 },
            { name: 'Liquor/Wines',  basePrice: 83, economicFactor: -5, unit: 't', baseQuantity: 251, mask: 0b00001111 },
            { name: 'Luxuries',  basePrice: 196, economicFactor: 8, unit: 't', baseQuantity: 54, mask: 0b00000011 },
            { name: 'Narcotics',  basePrice: 235, economicFactor: 29, unit: 't', baseQuantity: 8, mask: 0b01111000 },
            { name: 'Computers',  basePrice: 154, economicFactor: 14, unit: 't', baseQuantity: 56, mask: 0b00000011 },
            { name: 'Machinery',  basePrice: 117, economicFactor: 6, unit: 't', baseQuantity: 40, mask: 0b00000111 },
            { name: 'Alloys',  basePrice: 78, economicFactor: 1, unit: 't', baseQuantity: 17, mask: 0b00011111 },
            { name: 'Firearms',  basePrice: 124, economicFactor: 13, unit: 't', baseQuantity: 29, mask: 0b00000111 },
            { name: 'Furs',  basePrice: 176, economicFactor: -9, unit: 't', baseQuantity: 220, mask: 0b00111111 },
            { name: 'Minerals',  basePrice: 32, economicFactor: -1, unit: 't', baseQuantity: 53, mask: 0b00000011 },
            { name: 'Gold',  basePrice: 97, economicFactor: -1, unit: 'k', baseQuantity: 66, mask: 0b00000111 },
            { name: 'Platinum',  basePrice: 171, economicFactor: -2, unit: 'k', baseQuantity: 55, mask: 0b00011111 },
            { name: 'Gem-Stones',  basePrice: 45, economicFactor: -1, unit: 'g', baseQuantity: 250, mask: 0b00001111 },
            { name: 'Alien items',  basePrice: 53, economicFactor: 15, unit: 't', baseQuantity: 192, mask: 0b00000111 }
        ]
    }
}

function getNamedShip(ships: ShipBlueprint[], name: string, position: vec3, noseOrientation:vec3, role?: ShipRoleEnum) {
    return toInstance(ships.find(s => s.name === name)!, position, noseOrientation, role)
}

function toInstance(ship: ShipBlueprint, position: vec3, noseOrientation:vec3, role?: ShipRoleEnum) {
    return {
        role: role ?? ShipRoleEnum.Trader,
        blueprint: ship,
        position: position,
        noseOrientation: noseOrientation,
        roofOrientation: [0,1,0],
        rightOrientation: [1,0,0],
        roll: 0.0,
        totalRoll: 0.0,
        pitch: 0.0,
        totalPitch: 0.0,
        speed: 0.0,
        rendering: {
            shininess: 16.0
        }
    } as ShipInstance
}

function getRandomShip(ships:ShipBlueprint[]) {
    return ships[Math.floor(Math.random() * ships.length)]
}