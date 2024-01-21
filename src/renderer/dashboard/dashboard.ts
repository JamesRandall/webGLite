import {Game} from "../../model/game";
import {frameColor, frameWidth} from "../../constants";
import {createPrimitiveRenderer, Primitives} from "../primitives/primitives";
import {mat4, vec2, vec3, vec4} from "gl-matrix";
import {createScannerBackgroundRenderer} from "./scannerBackground";
import {createScannerShipRenderer} from "./scannerShips";

function setup(gl: WebGLRenderingContext) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthFunc(gl.LEQUAL)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
}

function drawCompass(width: number, sidePanelWidth: number, draw2d: Primitives, game: Game) {
    const compassRadius = 33.0
    const innerCompassRadius = compassRadius - frameWidth
    const compassCenter = vec2.fromValues(width - sidePanelWidth - frameWidth - compassRadius, compassRadius)
    draw2d.rect([compassCenter[0] - compassRadius, 0], [frameWidth, compassRadius], frameColor)
    draw2d.rect([compassCenter[0] - compassRadius + frameWidth, 0], [compassRadius * 2 - frameWidth, compassRadius], [1, 0, 0, 1])
    draw2d.rect(compassCenter, [compassRadius, compassRadius], [1, 0, 0, 1])
    draw2d.rect([compassCenter[0], compassRadius * 2 - frameWidth], [compassRadius, frameWidth], frameColor)
    draw2d.circle(compassCenter, compassRadius, frameColor)
    draw2d.circle(compassCenter, compassRadius - frameWidth, [0, 0, 0, 1])
    // TODO: fish out the space station
    //const compassPointsTowards = game.player.isInSafeZone && game.localBubble.station !== null ? game.localBubble.station.position : game.localBubble.planet.position
    const compassPointsTowards = game.localBubble.station !== null ? game.localBubble.station.position : game.localBubble.planet.position
    const directionVector = vec3.normalize(vec3.create(), compassPointsTowards)
    const compassWidth = 8.0
    const compassHeight = 6.0
    const xPos = innerCompassRadius * directionVector[0] - compassWidth / 2
    const yPos = (innerCompassRadius - compassHeight / 2) * directionVector[1] * -1 - compassHeight / 2
    const compassColor = directionVector[2] < 0 ? vec4.fromValues(1, 1, 1, 1) : vec4.fromValues(0.5, 0.5, 0.5, 1)
    draw2d.rect([compassCenter[0] + xPos, compassCenter[1] + yPos], [compassWidth, compassHeight], compassColor)
    return compassCenter
}

function drawHud(draw2d:Primitives, width: number, height: number, game:Game) {
    const sidePanelWidth = width/5.0
    const barHeight = (height - frameWidth) / 7
    const barSpacing = 8
    const leftStartBarX = sidePanelWidth / 7 * 2
    const rightStartBarX = width - sidePanelWidth
    const barWidth = sidePanelWidth-leftStartBarX
    for (let barIndex=1; barIndex <= 6; barIndex++) {
        draw2d.rect([leftStartBarX,barIndex*barHeight], [barWidth,3], [0.0,1.0,0.0,1.0])
        draw2d.rect([rightStartBarX,barIndex*barHeight], [barWidth,3], [0.0,1.0,0.0,1.0])
    }

    function drawBar(isLeft: boolean, row: number, value:number, maxValue: number, color: vec4) {
        const unitScale = barWidth / maxValue
        const x = isLeft ? leftStartBarX : rightStartBarX
        const y = row * (barHeight) + barSpacing + 1

        draw2d.rect([x,y], [value*unitScale,barHeight-barSpacing*2], color)
    }

    function drawPositionalBar(isLeft: boolean, row: number, value:number, maxValue: number) {
        const barSize = 4.0
        const unitScale = (barWidth-barSize) / 2 / maxValue
        const x = (isLeft ? leftStartBarX : rightStartBarX) + value*unitScale + barWidth/2 - barSize/2
        const y = row * (barHeight) + 3.0

        draw2d.rect([x,y], [barSize,barHeight - 2.0], vec4.fromValues(1.0,1.0,1.0,1.0))
    }

    // missiles
    const missileRow = 7
    const missileSpacing = 5
    let missileSize = barHeight-missileSpacing*2
    let missileX = sidePanelWidth - missileSpacing - missileSize
    const missileY = (missileRow-1)*barHeight + missileSpacing + 1
    for (let missileIndex=0; missileIndex < game.player.missiles.currentNumber; missileIndex++) {
        const missileColor = vec4.fromValues(0.0, 1.0, 0.0, 1.0)
        draw2d.rect([missileX,missileY], [missileSize,missileSize], missileColor)
        missileX -= missileSpacing + missileSize
    }
    const ch = barHeight-6
    const cw = ch/1.2
    const tl = frameWidth*2
    const tr = rightStartBarX + barWidth + 3

    const standardBarColor = vec4.fromValues(1.0,0.0,1.0,1.0)
    drawBar(true,
        0,
        game.player.forwardShield,
        game.player.ship.maxForwardShield,
        standardBarColor
        )
    draw2d.text.drawAtSize('FS', [tl,barHeight], cw , ch ,0, vec4.fromValues(0.0,1.0,1.0,1.0))
    drawBar(true,
        1,
        game.player.aftShield,
        game.player.ship.maxAftShield,
        standardBarColor
    )
    draw2d.text.drawAtSize('AS', [tl,barHeight*2], cw , ch ,0, vec4.fromValues(0.0,1.0,1.0,1.0))
    drawBar(true,
        2,
        game.player.fuel,
        game.player.ship.maxFuel,
        vec4.fromValues(1.0,1.0,0.0,1.0)
    )
    draw2d.text.drawAtSize('FV', [tl,barHeight*3], cw , ch ,0, vec4.fromValues(0.0,1.0,1.0,1.0))
    drawBar(
        true,
        3,
        game.player.cabinTemperature,
        game.player.ship.maxCabinTemperature,
        (game.player.cabinTemperature/game.player.ship.maxCabinTemperature) > 0.8 ? vec4.fromValues(1,0,0,1) : vec4.fromValues(1,1,1,1))
    draw2d.text.drawAtSize('CT', [tl,barHeight*4], cw , ch ,0, standardBarColor)
    drawBar(
        true,
        4,
        game.player.laserTemperature,
        game.player.ship.maxLaserTemperature,
        (game.player.laserTemperature/game.player.ship.maxLaserTemperature) > 0.8 ? vec4.fromValues(1,0,0,1) : vec4.fromValues(1,1,1,1))
    draw2d.text.drawAtSize('LT', [tl,barHeight*5], cw , ch ,0, standardBarColor)
    drawBar(
        true,
        5,
        game.player.altitude,
        game.player.ship.maxAltitude,
        vec4.fromValues(1.0,1.0,0.0,1.0))
    draw2d.text.drawAtSize('AL', [tl,barHeight*6], cw , ch ,0, standardBarColor)
    drawBar(
        false,
        0,
        game.player.speed,
        game.player.ship.maxSpeed,
        (game.player.speed/game.player.ship.maxSpeed) > 0.8 ? vec4.fromValues(1,0,0,1) : vec4.fromValues(1,1,1,1))
    draw2d.text.drawAtSize('SP', [tr,barHeight], cw , ch ,0, vec4.fromValues(0.0,1.0,1.0,1.0))
    drawPositionalBar(
        false,
        1,
        game.player.roll,
        game.player.ship.maxRollSpeed)
    draw2d.text.drawAtSize('RL', [tr,barHeight*2], cw , ch ,0, vec4.fromValues(0.0,1.0,1.0,1.0))
    drawPositionalBar(
        false,
        2,
        game.player.pitch,
        game.player.ship.maxPitchSpeed)
    draw2d.text.drawAtSize('DC', [tr,barHeight*3], cw , ch ,0, vec4.fromValues(0.0,1.0,1.0,1.0))
    drawBar(false,
        3,
        game.player.energyBankLevel[0],
        game.player.ship.maxEnergyBankLevel[0],
        standardBarColor
    )
    draw2d.text.drawAtSize('1', [tr+cw/2,barHeight*4], cw , ch ,0, standardBarColor)
    drawBar(false,
        4,
        game.player.energyBankLevel[1],
        game.player.ship.maxEnergyBankLevel[1],
        standardBarColor
    )
    draw2d.text.drawAtSize('2', [tr+cw/2,barHeight*5], cw , ch ,0, standardBarColor)
    drawBar(false,
        5,
        game.player.energyBankLevel[2],
        game.player.ship.maxEnergyBankLevel[2],
        standardBarColor
    )
    draw2d.text.drawAtSize('3', [tr+cw/2,barHeight*6], cw , ch ,0, standardBarColor)
    drawBar(false,
        6,
        game.player.energyBankLevel[3],
        game.player.ship.maxEnergyBankLevel[3],
        standardBarColor
    )
    draw2d.text.drawAtSize('4', [tr+cw/2,barHeight*7], cw , ch ,0, standardBarColor)

    const compassCenter = drawCompass(width, sidePanelWidth, draw2d, game);
    if (game.player.isInSafeZone && !game.player.isDocked) {
        const safeZoneW = 30
        const safeZoneH = 30
        const safeZone = vec2.fromValues(
            compassCenter[0] - safeZoneW / 2 + 2,
            //rightStartBarX - safeZoneW - safeZoneW/2,
            draw2d.size().height - safeZoneH / 2
        )
        draw2d.text.drawAtSize('S', safeZone, safeZoneW, safeZoneH, 0, [1, 1, 1, 1])
    }
}

function drawFrame(draw2d:Primitives, width: number, height: number) {
    draw2d.rect([0,0], [frameWidth,height], frameColor)
    draw2d.rect([0,height-frameWidth], [width,height-frameWidth], frameColor)
    draw2d.rect([width-frameWidth,0], [frameWidth,height], frameColor)
    draw2d.rect([width/5,0], [frameWidth,height], frameColor)
    draw2d.rect([width-width/5 - frameWidth,0], [frameWidth,height], frameColor)
}

export function createDashboardRenderer(gl:WebGLRenderingContext) {

    const width = gl.canvas.width
    const height = gl.canvas.height
    // this is the co-ordinate space for the scanner, the model for the scanner is 2 units wide and deep
    // (its a square -1,-1,0 at the top left, 1,1,0 at the bottom right)
    const scannerScale = vec3.fromValues(2.7,1,1)

    const canvas = gl.canvas as HTMLCanvasElement
    const fieldOfView = (45 * Math.PI) / 180 // in radians
    const aspect = canvas.clientWidth / canvas.clientHeight
    const zNear = 0.1
    const zFar = 512.0
    const perspectiveMatrix = mat4.create()
    mat4.perspective(perspectiveMatrix, fieldOfView, aspect, zNear, zFar)

    const eye = vec3.fromValues(0,2,2.2)
    const center = vec3.fromValues(0,0,0)
    const up = vec3.fromValues(0,1,0)
    const cameraMatrix = mat4.lookAt(mat4.create(), eye, center, up)

    const projectionMatrix = mat4.create()
    mat4.multiply(projectionMatrix, cameraMatrix, projectionMatrix)
    mat4.multiply(projectionMatrix, perspectiveMatrix, projectionMatrix)

    const draw2d = createPrimitiveRenderer(gl,true)
    const scannerBackgroundRenderer = createScannerBackgroundRenderer(gl, projectionMatrix, scannerScale)
    const scannerShipRenderer = createScannerShipRenderer(gl, projectionMatrix, scannerScale)

    return (game:Game) => {

        setup(gl)

        gl.disable(gl.DEPTH_TEST)
        scannerBackgroundRenderer()
        scannerShipRenderer(game)
        drawFrame(draw2d, width, height)
        drawHud(draw2d, width, height, game)
    }
}