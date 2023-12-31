import {ShipBlueprint} from "./shipBlueprint";
import {ControlState, getEmptyControlState} from "../controls/controlState";
import {Position, StarSystem} from "./starSystem";
import {Resources} from "../resources/resources";
import {vec2} from "gl-matrix";

enum MissileTargettingStatusEnum {
    Normal,
    Targetting,
    LockedOn
}

export enum LegalStatusEnum {
    Clean
}

export enum CombatRatingEnum {
    Harmless,
    MostlyHarmless,
    Poor,
    Average,
    AboveAverage,
    Competent,
    Dangerous,
    Deadly,
    Elite
}

export enum LaserTypeEnum {
    None,
    Pulse,
    Beam,
    Mining,
    Military
}

export interface PlayerEquipment {
    frontLaser: LaserTypeEnum,
    aftLaser: LaserTypeEnum,
    portLaser: LaserTypeEnum,
    starboardLaser: LaserTypeEnum
    largeCargoBay: boolean,
    ecmSystem: boolean,
    fuelScoops: boolean,
    galacticHyperdrive: boolean
    dockingComputer: boolean
}

export interface Player {
    previousControlState: ControlState
    controlState: ControlState
    ship: ShipBlueprint
    pitch: number
    roll: number
    speed: number
    cash: number
    name: string
    legalStatus: LegalStatusEnum
    combatRating: CombatRatingEnum
    isDocked: boolean
    isInSafeArea: boolean
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
    equipment: PlayerEquipment
    selectedSystem: StarSystem // the system the player has selected in the star charts
    scannerCursor: vec2
    cargoHoldContents: number[]
}

export function getStartingPlayer(resources: Resources, currentSystem: StarSystem) : Player {
    const cobra = resources.ships.getCobraMk3([0,0,0], [0,1,0]).blueprint
    return {
        previousControlState: getEmptyControlState(),
        controlState: getEmptyControlState(),
        ship: cobra,
        pitch: 0.0, // radians per second
        roll: 0.0, // radians per second
        speed: 0.0,
        cash: 100.0,
        name: 'Jameson',
        legalStatus: LegalStatusEnum.Clean,
        combatRating: CombatRatingEnum.Harmless,
        isDocked: true,
        isInSafeArea: true,
        fuel: cobra.maxFuel, // 70 is a full tank, goes 7 lightyears
        energyBankLevel: [cobra.maxEnergyBankLevel[0]-1,cobra.maxEnergyBankLevel[1],cobra.maxEnergyBankLevel[2],cobra.maxEnergyBankLevel[3]],
        cabinTemperature: 10,
        laserTemperature: 0,
        altitude: cobra.maxAltitude,
        forwardShield: cobra.maxForwardShield,
        aftShield: cobra.maxAftShield,
        missiles: {
            currentNumber: cobra.maxMissiles-1,
            status: MissileTargettingStatusEnum.Normal
        },
        equipment: {
            frontLaser: LaserTypeEnum.Pulse,
            aftLaser: LaserTypeEnum.None,
            portLaser: LaserTypeEnum.None,
            starboardLaser: LaserTypeEnum.None,
            largeCargoBay: false,
            dockingComputer: false,
            ecmSystem: false,
            galacticHyperdrive: false,
            fuelScoops: false
        },
        cargoHoldContents: [],
        selectedSystem: currentSystem,
        scannerCursor: vec2.copy(vec2.create(), currentSystem.galacticPosition)
    }
}

