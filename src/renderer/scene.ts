import {createShipsRenderer} from "./ships";
import {createStardustRenderer} from "./stardust";
import {createSunRenderer} from "./sun";
import {createPrimitiveRenderer, Primitives} from "./primitives/primitives";
import {Game, SceneEnum} from "../model/game";
import {createLocalChartRenderer} from "./localChart";
import {frameColor, frameWidth} from "../constants";
import {createSystemDetailsRenderer} from "./systemDetails";

function setup(gl: WebGLRenderingContext) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
}

function drawFrame(draw2d: Primitives) {
    const sz = draw2d.size()


    draw2d.rect([0,0], [sz.width, frameWidth], frameColor)
    draw2d.rect([0,sz.height-frameWidth], [sz.width, frameWidth], frameColor)
    draw2d.rect([0,0], [frameWidth, sz.height], frameColor)
    draw2d.rect([sz.width-frameWidth,0], [frameWidth, sz.height], frameColor)
}

export function createSceneRenderer(gl:WebGLRenderingContext) {
    const shipRenderer = createShipsRenderer(gl)
    const stardustRenderer = createStardustRenderer(gl)
    const sunRenderer = createSunRenderer(gl)
    const draw2d = createPrimitiveRenderer(gl)
    const localChartRenderer = createLocalChartRenderer(draw2d)
    const systemDetailsRenderer = createSystemDetailsRenderer(draw2d)

    return (game:Game, timeDelta:number) => {
        setup(gl)

        switch(game.currentScene) {
            case SceneEnum.Front:
                shipRenderer(game.localBubble)
                sunRenderer(game.localBubble,timeDelta)
                stardustRenderer(game.localBubble)

                break;
            case SceneEnum.LocalMap:
                localChartRenderer(game)
                break;
            case SceneEnum.SystemDetails:
                systemDetailsRenderer(game)
        }

        gl.disable(gl.DEPTH_TEST)
        drawFrame(draw2d)
    }
}