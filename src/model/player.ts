import {getCobraMk3, ShipSpecification} from "./ships";
import {ControlState, getEmptyControlState} from "../controls/controlState";
import {Position, StarSystem} from "./starSystem";

enum MissileTargettingStatusEnum {
    Normal,
    Targetting,
    LockedOn
}

export interface Player {
    previousControlState: ControlState
    controlState: ControlState
    ship: ShipSpecification
    pitch: number
    roll: number
    speed: number
    isDocked: boolean
    fuel: number
    energyBankLevel: number[]
    cabinTemperature: number
    laserTemperature: number
    altitude: number
    forwardShield: number
    aftShield: number
    missiles: {
        currentNumber: number
        status: MissileTargettingStatusEnum
    }
    currentSystem: StarSystem // the system the player is currently in
    selectedSystem: StarSystem // the system the player has selected in the star charts
    scannerCursor: Position
}

export function getStartingPlayer(currentSystem: StarSystem) : Player {
    const cobra = getCobraMk3([0,0,0], [0,1,0]).type
    return {
        previousControlState: getEmptyControlState(),
        controlState: getEmptyControlState(),
        ship: cobra,
        pitch: 0.0, // radians per second
        roll: 0.0, // radians per second
        speed: 0.0,
        isDocked: false,
        fuel: cobra.maxFuel, // 70 is a full tank, goes 7 lightyears
        energyBankLevel: [cobra.maxEnergyBankLevel[0]-1,cobra.maxEnergyBankLevel[1],cobra.maxEnergyBankLevel[2],cobra.maxEnergyBankLevel[3]],
        cabinTemperature: 10,
        laserTemperature: 0,
        altitude: cobra.maxAltitude,
        forwardShield: cobra.maxForwardShield,
        aftShield: cobra.maxAftShield,
        missiles: {
            currentNumber: cobra.maxMissiles,
            status: MissileTargettingStatusEnum.Normal
        },
        currentSystem: currentSystem,
        selectedSystem: currentSystem,
        scannerCursor: { x: currentSystem.galacticPosition.x, y: currentSystem.galacticPosition.y }
    }
}

