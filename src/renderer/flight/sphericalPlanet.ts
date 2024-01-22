import {compileShaderProgram} from "../../shader";
import {LocalBubble} from "../../model/localBubble";
import {mat4, quat, vec3} from "gl-matrix";
import {createSphere} from "../../resources/sphere";
import {Resources} from "../../resources/resources";
import {setCommonAttributes, setViewUniformLocations} from "../coregl/programInfo";
import {planetScaleFactor} from "../../constants";

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
    
    uniform vec3 uLightWorldPosition;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vVertex = vec3(uModelViewMatrix*aVertexPosition);
      vTextureCoord = aTextureCoord;
      highp vec3 transformedNormal = mat3(uNormalMatrix) * aVertexNormal;
      vNormal = transformedNormal;
    }
  `
const fsSource = `#version 300 es
    precision highp int;
    precision highp float;
    
    in highp vec3 vNormal;
    in highp vec3 vVertex;
    in highp vec2 vTextureCoord;
    
    out lowp vec4 outputColor;
    
    uniform highp float uShininess;
    uniform vec3 uLightWorldPosition;
    uniform sampler2D uSampler;

    void main(void) {
        vec4 tex = texture(uSampler, vTextureCoord);
        vec4 aColor = tex;
        
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

  color = ambient_color + diffuse_color + specular_color;
   
  outputColor = vec4(color,aColor.a);
}
  `

function initShaderProgram(gl: WebGLRenderingContext) {
    const shaderProgram = compileShaderProgram(gl, vsSource, fsSource)
    if (!shaderProgram) {
        return null
    }

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
            shininess: gl.getUniformLocation(shaderProgram, "uShininess")!,
            textureSampler: gl.getUniformLocation(shaderProgram, "uSampler")!
        },
    }
}

export function createSphericalPlanetRenderer(gl: WebGLRenderingContext, resources: Resources) {
    const programInfo = initShaderProgram(gl)!

    const sphere = createSphere(gl, {
        radius: 1,
        subdivisionsAxis: 120,
        subdivisionsHeight: 60,
        textureFile: "./meridian.png"
    })

    return function (projectionMatrix: mat4, localBubble: LocalBubble, timeDelta: number) {
        gl.useProgram(programInfo.program);

        const planet = localBubble.planet
        // Firstly we point the ship along the nose orientation
        const targetToMatrix = mat4.targetTo(mat4.create(), [0, 0, 0], planet.noseOrientation, planet.roofOrientation)
        const targetToQuat = mat4.getRotation(quat.create(), targetToMatrix)
        const viewPosition = planet.position
        const scaledRadius = planet.radius * planetScaleFactor
        const scale = vec3.fromValues(scaledRadius, scaledRadius, scaledRadius)
        const modelViewMatrix = mat4.fromRotationTranslationScale(mat4.create(), targetToQuat, viewPosition, scale)
        const normalMatrix = mat4.create()
        mat4.invert(normalMatrix, modelViewMatrix)
        mat4.transpose(normalMatrix, normalMatrix)

        setCommonAttributes(gl, sphere, programInfo)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.indices)
        setViewUniformLocations(gl, programInfo,
            {
                modelViewMatrix,
                normalMatrix,
                projectionMatrix,
                lightWorldPosition: localBubble.sun.position,
                shininess: 128,
                textureIndex: 0
            },
            resources.textures.planets[planet.surfaceTextureIndex])

        {
            const vertexCount = sphere.vertexCount;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
    }
}