import {compileShaderProgram} from "../../shader";
import {LocalBubble} from "../../model/localBubble";
import {mat4, quat, vec2, vec3} from "gl-matrix";
import {loadTexture} from "../../resources/models";

// This handily shows how to get a shadertoy shader in:
//    https://webglfundamentals.org/webgl/lessons/webgl-shadertoy.html
// Made a start.

const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec4 aVertexColor;
    attribute vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec3 vLighting;
    varying lowp vec4 vColor;
    varying highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
      vTextureCoord = aTextureCoord;
      
      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      //highp vec3 directionalVector = normalize(vec3(-0.5, 0.8, 0.75));
      highp vec3 directionalVector = normalize(vec3(0.0, 0.0, -1.0));
      
      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `


const fsSource = `
precision highp float;
    varying lowp vec4 vColor;
    varying highp vec3 vLighting;
    varying highp vec2 vTextureCoord;
    
    uniform vec3 uLightDirection;
    uniform sampler2D uSampler;
    uniform sampler2D uLandscapeSampler;
    uniform vec2 iResolution;
    uniform vec2 iMouse;
    uniform float iTime;

    #define R0 1.0000   // Nomralized Earth radius (6360 km)
    #define R1 1.0094   // Atmosphere radius (6420 km) 

// This is really a nifty spherical texture wrapper with no need for a sphere.
// https://www.shadertoy.com/view/wsGBzR
// Copyright with original author
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float ratio = iResolution.x / iResolution.y;
    
    vec2 uv = vec2(ratio, 1.) * (2. * fragCoord.xy / iResolution.xy - 1.);
    
    // Distancia con respecto al centro.
    float luv = length(uv);
    if (luv > 1.1) {
        fragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }
    
    // Normal de la esfera.
    vec3 n = vec3(uv, sqrt(1. - clamp(dot(uv, uv), 0., 1.)));
    
    // Dirección de la luz.
    // NOTA: Si quieres que rote la luz descomenta esta línea
    // y comente la siguiente.
    //vec3 l = vec3(cos(iTime * 0.1), 0., sin(iTime * 0.1));
    //vec3 l = vec3(0.5, 0.5, 1.0);
    vec3 l = uLightDirection;
    
    // Ángulo de incidencia de la luz.
    float a = dot(n, l);
    
    // Color de la atmósfera.
    // TODO: Esto se podría mejorar con una atmósfera que pueda tener
    // más de un color o que el color varíe en función del ángulo de
    // incidencia. Debería consultar: https://es.wikipedia.org/wiki/Dispersi%C3%B3n_de_Rayleigh
    vec3 atmc = vec3(0.75, 0.5, 0.25);
    if (luv > 1.0) {
        float atm = mix(clamp(a, 0., .25), 0.0, (luv - 1.0) / (1.1 - 1.0));
        fragColor = vec4(atmc * atm, atm);
        return;
    }
    
    vec3 t = vec3(n);

    // En los cálculos originales en vez de Pi, usan Tau
    // porque realmente están mapeando una esfera completa.
    // En nuestro caso se puede considerar que es una semi-esfera,
    // por lo tanto, usamos Pi.
    // float s = 0.5 + atan(n.z, n.x) / (2. * 3.1415);
    float phase = mod(iTime * 0.01, 1.0);
    vec2 tuv = vec2(
        phase + atan(t.z, t.x) / 3.1415,
        0.5 - asin(t.y) / 3.1415
    );
    
    // Encontré una forma de simular el scattering de una superficie
    // @see https://www.shadertoy.com/view/lsGGDd
    float scatter = 4.0 * pow((sqrt(R1 - dot(uv, uv)) - n.z) / sqrt(R1 - R0), 1.35);

    // vec3 color = 0.5 + 0.5 * n;
    vec3 tex = texture2D(uLandscapeSampler, tuv).xyz;
    // If we don't want to do hi-fidelity texture stuff we can use simple colours instead. More in keeping really!
    //vec3 tex = vec3(0.5,0.2,0.2);
    vec3 color = mix(
        vec3(0.5), 
        tex,
        smoothstep(1.01, 1., dot(uv, uv))
    ) * a;
    
    vec3 halo = mix(vec3(0.0), color, scatter);

    fragColor = vec4(color + halo, 1.0);
}

    void main(void) {
      vec4 tex = texture2D(uSampler, vTextureCoord);
      //if (tex.a < 1.0) {
      //  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      //}
      //else {
        vec2 xy = vTextureCoord.xy * 256.0; //gl_FragCoord.xy; // / 2.0;
        mainImage(gl_FragColor, xy);
        //gl_FragColor = vec4(tex.r, tex.g, tex.b, 1.0);
        //gl_FragColor = vec4(1.0,0.0,0.0,1.0); // vec4(vColor.rgb * vLighting, vColor.a);
      //}
      
    }
  `

interface ProgramInfo {
    program: WebGLProgram,
    attribLocations: {
        vertexPosition: number,
        vertexNormal: number,
        vertexColor: number,
        textureCoords: number
    },
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation,
        modelViewMatrix: WebGLUniformLocation,
        normalMatrix: WebGLUniformLocation,
        mouse: WebGLUniformLocation,
        resolution: WebGLUniformLocation,
        time: WebGLUniformLocation,
        sampler: WebGLUniformLocation,
        landscapeSampler: WebGLUniformLocation
        lightDirection: WebGLUniformLocation
    }
}

function initShaderProgram(gl:WebGLRenderingContext) : ProgramInfo | null {
    const shaderProgram = compileShaderProgram(gl, vsSource, fsSource)
    if (!shaderProgram) { return null }

    return {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
            vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
            textureCoords: gl.getAttribLocation(shaderProgram, "aTextureCoord")
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!,
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!,
            normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix")!,
            mouse: gl.getUniformLocation(shaderProgram, "iMouse")!,
            time: gl.getUniformLocation(shaderProgram, "iTime")!,
            resolution: gl.getUniformLocation(shaderProgram, "iResolution")!,
            sampler: gl.getUniformLocation(shaderProgram, "uSampler")!,
            landscapeSampler: gl.getUniformLocation(shaderProgram, "uLandscapeSampler")!,
            lightDirection: gl.getUniformLocation(shaderProgram, "uLightDirection")!
        },
    }
}

function setNormalAttribute(gl:WebGLRenderingContext, buffers:any, programInfo:ProgramInfo) {
    const numComponents = 3
    const type = gl.FLOAT
    const normalize = false
    const stride = 0
    const offset = 0
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals)
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexNormal,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal)
}


function setTextureAttribute(gl:WebGLRenderingContext, buffers:any, programInfo:ProgramInfo) {
    const num = 2 // every coordinate composed of 2 values
    const type = gl.FLOAT // the data in the buffer is 32-bit float
    const normalize = false // don't normalize
    const stride = 0 // how many bytes to get from one set to the next
    const offset = 0 // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoords)
    gl.vertexAttribPointer(
        programInfo.attribLocations.textureCoords,
        num,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoords);
}


function setColorAttribute(gl:WebGLRenderingContext, buffers:any, programInfo:ProgramInfo) {
    const numComponents = 4
    const type = gl.FLOAT
    const normalize = false
    const stride = 0
    const offset = 0
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color)
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    )
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor)
}

function setPositionAttribute(gl:WebGLRenderingContext, buffers:any, programInfo:ProgramInfo) {
    const numComponents = 3; // pull out 2 values per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

export function createPlanetRenderer(gl:WebGLRenderingContext) {
    const programInfo = initShaderProgram(gl)!
    const landscapeTexture = loadTexture(gl, "./planet1.jpg")!
    let time = 0.0

    return function (localBubble: LocalBubble, timeDelta: number) {
        time = 12.0

        // we can't use the current orientation of the sun to light the planet due to it not really being a sphere
        // so instead we just keep hold of the original normal of the sun and that prevents it shifting slightly
        // and as the planet and sun never change position in relation to each other works quite nicely
        const lightDirection = vec3.multiply(vec3.create(),localBubble.sun.initialOrientation,[-1,-1,-1])
        vec3.normalize(lightDirection,lightDirection)

        const canvas = gl.canvas as HTMLCanvasElement
        const fieldOfView = (45 * Math.PI) / 180 // in radians
        const aspect = canvas.clientWidth / canvas.clientHeight
        const zNear = 0.1
        const zFar = localBubble.clipSpaceRadius*1.2
        const projectionMatrix = mat4.create()
        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

        gl.useProgram(programInfo.program);

        // Set the shader uniforms
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix,
        )

        const planet = localBubble.planet
        const targetToMatrix = mat4.targetTo(mat4.create(), [0,0,0], planet.orientation, planet.upOrientation)
        const targetToQuat = mat4.getRotation(quat.create(), targetToMatrix)
        const modelViewMatrix = mat4.fromRotationTranslationScale(mat4.create(), targetToQuat, planet.position,[480.0,480.0,1.0])
        const normalMatrix = mat4.create()
        mat4.invert(normalMatrix, modelViewMatrix)
        mat4.transpose(normalMatrix, normalMatrix)
        const resolution = vec2.fromValues(256.0,256.0)
        const mouse = vec2.fromValues(32,32)

        setPositionAttribute(gl, planet.model, programInfo)
        setColorAttribute(gl, planet.model, programInfo)
        setNormalAttribute(gl, planet.model, programInfo)
        setTextureAttribute(gl, planet.model, programInfo)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, planet.model.indices)
        // Tell WebGL to use our program when drawing
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix,
        )
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.normalMatrix,
            false,
            normalMatrix,
        )
        gl.uniform3fv(programInfo.uniformLocations.lightDirection, lightDirection)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, localBubble.sun.model.texture)
        gl.uniform1i(programInfo.uniformLocations.sampler, 0)

        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, landscapeTexture)
        gl.uniform1i(programInfo.uniformLocations.landscapeSampler, 1)

        gl.uniform2fv(programInfo.uniformLocations.mouse, mouse)
        gl.uniform2fv(programInfo.uniformLocations.resolution, resolution)
        gl.uniform1f(programInfo.uniformLocations.time, time)


        {
            const vertexCount = planet.model.vertexCount;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
    }
}