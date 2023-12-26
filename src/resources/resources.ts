import {loadShipSpecifications, ShipInstance, ShipSpecification} from "../model/ships";
import {vec3} from "gl-matrix";

export interface Resources {
    ships: {
        numberOfShips: number,
        getRandomShip: () => ShipSpecification,
        getIndexedShip: (index:number, position: vec3, noseOrientation: vec3) => ShipInstance
        getCobraMk3: (position: vec3, noseOrientation: vec3) => ShipInstance,
        getViper: (position: vec3, noseOrientation: vec3) => ShipInstance,
        getThargoid: (position: vec3, noseOrientation: vec3) => ShipInstance
    }
}

export async function loadResources(gl:WebGLRenderingContext) : Promise<Resources> {
    const ships = await loadShipSpecifications(gl)
    return {
        ships: {
            numberOfShips: ships.length,
            getRandomShip: () => getRandomShip(ships),
            getIndexedShip: (index:number, position: vec3, noseOrientation: vec3) => toInstance(ships[index], position, noseOrientation),
            getCobraMk3: (position: vec3, noseOrientation: vec3) => getNamedShip(ships, 'Cobra Mk III', position, noseOrientation),
            getViper: (position: vec3, noseOrientation: vec3) => getNamedShip(ships, 'Viper', position, noseOrientation),
            getThargoid: (position: vec3, noseOrientation: vec3) => getNamedShip(ships, 'Thargoid', position, noseOrientation)
        }
    }
}

function getNamedShip(ships: ShipSpecification[], name: string, position: vec3, noseOrientation:vec3) {
    return {
        type: ships.find(s => s.name === name)!,
        position: position,
        noseOrientation: noseOrientation,
        roofOrientation: [0,1,0],
        rightOrientation: [1,0,0],
        roll: 0.0,
        pitch: 0.0,
        speed: 0.0,
        rendering: {
            shininess: 16.0
        }
    } as ShipInstance
}

function toInstance(ship: ShipSpecification, position: vec3, noseOrientation:vec3) {
    return {
        type: ship,
        position: position,
        noseOrientation: noseOrientation,
        roofOrientation: [0,1,0],
        rightOrientation: [1,0,0],
        roll: 0.0,
        pitch: 0.0,
        speed: 0.0,
        rendering: {
            shininess: 16.0
        }
    } as ShipInstance
}

function getRandomShip(ships:ShipSpecification[]) {
    return ships[Math.floor(Math.random() * ships.length)]
}