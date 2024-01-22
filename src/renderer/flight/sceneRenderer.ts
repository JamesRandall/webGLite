import {createShipsRenderer} from "./ships";
import {createStardustRenderer} from "./stardust";
import {createSunRenderer} from "./sun";
import {createPrimitiveRenderer} from "../primitives/primitives";
import {Game, SceneEnum} from "../../model/game";
import {createLocalChartRenderer} from "../screens/localChart";
import {createSystemDetailsRenderer} from "../screens/systemDetails";
import {
    bindBufferAndSetViewport,
    createFrameBufferTexture,
    createProjectionMatrix,
    drawFrame,
    setupGl
} from "../common";
import {createPlayerDetailsRenderer} from "../screens/playerDetails";
import {createLaunchingRenderer} from "../screens/launching";
import {createHyperspaceRenderer} from "../screens/hyperspace";
import {createSphericalPlanetRenderer} from "./sphericalPlanet";
import {Resources} from "../../resources/resources";
import {createBuyMarketItemsRenderer} from "../screens/buyMarketItems";

export function createSceneRenderer(gl:WebGLRenderingContext, resources: Resources) {
    const canvas = gl.canvas as HTMLCanvasElement
    const viewportWidth = canvas.clientWidth
    const viewportHeight = canvas.clientHeight

    const draw2d = createPrimitiveRenderer(gl, false, resources, viewportWidth, viewportHeight)

    const shipRenderer = createShipsRenderer(gl, resources)
    const stardustRenderer = createStardustRenderer(gl, resources)
    const sunRenderer = createSunRenderer(gl, resources)
    const planetRenderer = createSphericalPlanetRenderer(gl, resources)
    const localChartRenderer = createLocalChartRenderer(draw2d)
    const systemDetailsRenderer = createSystemDetailsRenderer(draw2d)
    const playerDetailsRenderer = createPlayerDetailsRenderer(draw2d)
    const launchingRenderer = createLaunchingRenderer(gl, viewportWidth, viewportHeight, resources)
    const hyperspaceRenderer = createHyperspaceRenderer(gl, viewportWidth, viewportHeight, resources)
    const buyMarketItemsRenderer = createBuyMarketItemsRenderer(draw2d)
    let flashOn = true
    let flashOnTime = 0

    const frameBufferTexture = createFrameBufferTexture(gl, viewportWidth, viewportHeight)!
    const frameBuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frameBufferTexture, 0)
    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    // make a depth buffer and the same size as the targetTexture
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, viewportWidth, viewportHeight);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    return (game:Game, timeDelta:number) => {
        bindBufferAndSetViewport(gl, frameBuffer, viewportWidth, viewportHeight)
        setupGl(gl)

        const projectionMatrix = createProjectionMatrix(viewportWidth, viewportHeight, game.localBubble.clipSpaceRadius)

        flashOnTime += timeDelta
        if (flashOnTime > 1.5) {
            flashOnTime = 0
            flashOn = !flashOn
        }

        switch(game.currentScene) {
            case SceneEnum.Front:
                gl.enable(gl.CULL_FACE)
                gl.enable(gl.DEPTH_TEST)
                shipRenderer(projectionMatrix, game.localBubble)
                sunRenderer(projectionMatrix, game.localBubble, timeDelta)
                planetRenderer(projectionMatrix, game.localBubble,timeDelta)
                stardustRenderer(game.localBubble)
                gl.disable(gl.CULL_FACE)
                gl.disable(gl.DEPTH_TEST)
                break

            case SceneEnum.LocalMap:
                localChartRenderer(game)
                break

            case SceneEnum.SystemDetails:
                systemDetailsRenderer(game)
                break

            case SceneEnum.PlayerDetails:
                playerDetailsRenderer(game)
                break

            case SceneEnum.Docking:
            case SceneEnum.Launching:
                launchingRenderer(game)
                break

            case SceneEnum.Hyperspace:
                hyperspaceRenderer(game)
                break

            case SceneEnum.BuyMarketItems:
                buyMarketItemsRenderer(game)
                break
        }

        gl.disable(gl.DEPTH_TEST)

        drawFrame(draw2d)
        if (game.hyperspace !== null && game.hyperspace.countdown > 0) {
            draw2d.text.draw(game.hyperspace.countdown.toString(), [0.5,0.5])
            const hyperspaceText = `HYPERSPACE - ${game.player.selectedSystem.name}`
            const xPos = 38/2 - hyperspaceText.length/2
            draw2d.text.draw(hyperspaceText, [xPos,21.5])
        }
        if (game.player.dockingComputerFlightExecuter !== null && flashOn) {
            draw2d.text.draw('DOCKING COMPUTER ON', [9.5,21.5])
        }

        game.diagnostics
            .map((item,index) => ({item,index}))
            .forEach(({item, index}) => {
                draw2d.text.draw(item, [1,index+1])
            })

        bindBufferAndSetViewport(gl, null, viewportWidth, viewportHeight)
        draw2d.texturedRect([0,0], [viewportWidth, viewportHeight], frameBufferTexture)
    }
}