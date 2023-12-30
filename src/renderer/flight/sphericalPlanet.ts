import {compileShaderProgram} from "../../shader";
import {LocalBubble} from "../../model/localBubble";
import {mat4, quat, vec3} from "gl-matrix";
import {createSphere} from "../../resources/sphere";
import {Resources} from "../../resources/resources";

const vsSource = `#version 300 es
    in vec4 aVertexPosition;
    in vec3 aVertexNormal;
    in vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    // point light
    
    out lowp vec4 vColor;
    out highp vec3 vNormal;
    out highp vec3 vVertex;
    out highp vec2 vTextureCoord;
    //out highp vec3 v_surfaceToLight;
    
    uniform vec3 uLightWorldPosition;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vVertex = vec3(uModelViewMatrix*aVertexPosition);
      vTextureCoord = aTextureCoord;
      highp vec3 transformedNormal = mat3(uNormalMatrix) * aVertexNormal;
      vNormal = transformedNormal;
      
      // this simpler lighting model can be used to test normals
      /*
      vec3 surfaceWorldPosition = (uModelViewMatrix * aVertexPosition).xyz;
      v_surfaceToLight = uLightWorldPosition - surfaceWorldPosition;*/
    }
  `
const fsSource = `#version 300 es
    precision highp int;
    precision highp float;
    
    in highp vec3 vNormal;
    in highp vec3 vVertex;
    in highp vec2 vTextureCoord;
    //in highp vec3 v_surfaceToLight;
    
    out lowp vec4 outputColor;
    
    uniform highp float uShininess;
    uniform vec3 uLightWorldPosition;
    uniform vec4 uColor;
    uniform sampler2D uSampler;

    void main(void) {
        vec4 tex = texture(uSampler, vTextureCoord);
        vec4 aColor = uColor;
        if (tex.a > 0.0) {
            //aColor = vec4(1,1,1,1);
            aColor = tex;
            //aColor = vec4(1,0,0,1);
            //aColor = vec4(1,tex.g,tex.b,1);
        }
    
    
        vec3 to_light;
          vec3 vertex_normal;
          vec3 reflection;
          vec3 to_camera;
          float cos_angle;
          vec3 diffuse_color;
          vec3 specular_color;
          vec3 ambient_color;
          vec3 color;
    
        vec3 lightColor = vec3(1.0,1.0,1.0);
        ambient_color = vec3(0.1,0.1,0.1) * aColor.rgb;
        to_light = uLightWorldPosition - vVertex;
        to_light = normalize(to_light);
        
        vertex_normal = normalize(vNormal);
        cos_angle = dot(vertex_normal, to_light);
        cos_angle = clamp(cos_angle, 0.0, 1.0);
        diffuse_color = vec3(aColor) * cos_angle;
        reflection = vec3(0.0,0.0,0.0); //2.0 * dot(vertex_normal,to_light) * vertex_normal - to_light;
        to_camera = -1.0 * vVertex;
        reflection = normalize( reflection );
          to_camera = normalize( to_camera );
          cos_angle = dot(reflection, to_camera);
          cos_angle = clamp(cos_angle, 0.0, 1.0);
          cos_angle = pow(cos_angle, uShininess);
    
        if (cos_angle > 0.0) {
    specular_color = lightColor * cos_angle;
    diffuse_color = diffuse_color * (1.0 - cos_angle);
  } else {
    specular_color = vec3(0.0, 0.0, 0.0);
  }

  color = ambient_color + diffuse_color; //+ specular_color;
   
        outputColor = vec4(color,aColor.a);
        
        // this simpler lighting model can be used for debugging normals
        /*
        vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
        float light = dot(vNormal, surfaceToLightDirection);
        outputColor = aColor;
        outputColor.rgb *= light;*/
    }
  `

interface ProgramInfo {
    program: WebGLProgram,
    attribLocations: {
        vertexPosition: number,
        vertexNormal: number,
        textureCoords: number
    },
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation,
        modelViewMatrix: WebGLUniformLocation,
        normalMatrix: WebGLUniformLocation,
        lightWorldPosition: WebGLUniformLocation,
        shininessPosition: WebGLUniformLocation,
        colorPosition: WebGLUniformLocation,
        samplerPosition: WebGLUniformLocation
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
            textureCoords: gl.getAttribLocation(shaderProgram, "aTextureCoord")
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!,
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!,
            normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix")!,
            lightWorldPosition: gl.getUniformLocation(shaderProgram, "uLightWorldPosition")!,
            shininessPosition: gl.getUniformLocation(shaderProgram, "uShininess")!,
            colorPosition: gl.getUniformLocation(shaderProgram, "uColor")!,
            samplerPosition: gl.getUniformLocation(shaderProgram, "uSampler")!
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

export function createSphericalPlanetRenderer(gl:WebGLRenderingContext, resources: Resources) {
    const programInfo = initShaderProgram(gl)!

    const sphere = createSphere(gl, {
        radius: 1,
        subdivisionsAxis: 120,
        subdivisionsHeight: 60,
        //textureFile: "./planet1.jpg"
        textureFile: "./meridian.png"
    })

    return function (localBubble: LocalBubble, timeDelta:number) {
        // Create a perspective matrix, a special matrix that is
        // used to simulate the distortion of perspective in a camera.
        // Our field of view is 45 degrees, with a width/height
        // ratio that matches the display size of the canvas
        // and we only want to see objects between 0.1 units
        // and 100 units away from the camera.

        const canvas = gl.canvas as HTMLCanvasElement
        const fieldOfView = (45 * Math.PI) / 180 // in radians
        const aspect = canvas.clientWidth / canvas.clientHeight
        const zNear = 0.1
        const zFar = localBubble.clipSpaceRadius
        const projectionMatrix = mat4.create()

        // note: glmatrix.js always has the first argument
        // as the destination to receive the result.
        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

        gl.useProgram(programInfo.program);

        // Set the shader uniforms
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix,
        )
        gl.uniform3fv(programInfo.uniformLocations.lightWorldPosition, localBubble.sun.position)
        //gl.uniform3fv(programInfo.uniformLocations.lightWorldPosition, [0,0,0]) // this puts the light at the player

            const planet = localBubble.planet
            // Firstly we point the ship along the nose orientation
            const targetToMatrix = mat4.targetTo(mat4.create(), [0,0,0], planet.noseOrientation, planet.roofOrientation)
            const targetToQuat = mat4.getRotation(quat.create(), targetToMatrix)
            const viewPosition = planet.position
            const scale = vec3.fromValues(planet.radius, planet.radius, planet.radius)
            const modelViewMatrix = mat4.fromRotationTranslationScale(mat4.create(), targetToQuat, viewPosition, scale)
            const normalMatrix = mat4.create()
            mat4.invert(normalMatrix, modelViewMatrix)
            mat4.transpose(normalMatrix, normalMatrix)

            setPositionAttribute(gl, sphere, programInfo)
            setNormalAttribute(gl, sphere, programInfo)
            setTextureAttribute(gl, sphere, programInfo)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.indices)
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
            gl.uniform4f(programInfo.uniformLocations.colorPosition, 0.6,0.0,0.0,1.0)
            gl.uniform1f(programInfo.uniformLocations.shininessPosition,8) //ship.rendering.shininess)

            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, resources.textures.planets[planet.surfaceTextureIndex])
            gl.uniform1i(programInfo.uniformLocations.samplerPosition, 0)

            {
                const vertexCount = sphere.vertexCount;
                const type = gl.UNSIGNED_SHORT;
                const offset = 0;
                gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
            }
    }
}