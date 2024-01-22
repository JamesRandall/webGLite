import {compileShaderProgram, loadShader} from "../../shader";
import {LocalBubble} from "../../model/localBubble";
import {mat4, quat, vec3} from "gl-matrix";
import {setCommonAttributes, setViewUniformLocations} from "../coregl/programInfo";

const vsSource = `#version 300 es
    in vec4 aVertexPosition;
    in vec3 aVertexNormal;
    in vec4 aVertexColor;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    // point light
    
    out lowp vec4 vColor;
    out highp vec3 vNormal;
    out highp vec3 vVertex;
    //out highp vec3 v_surfaceToLight;
    
    uniform vec3 uLightWorldPosition;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
      vVertex = vec3(uModelViewMatrix*aVertexPosition);
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
    
    in lowp vec4 vColor;
    in highp vec3 vNormal;
    in highp vec3 vVertex;
    //in highp vec3 v_surfaceToLight;
    
    out lowp vec4 outputColor;
    
    uniform highp float uShininess;
    uniform vec3 uLightWorldPosition;

    void main(void) {
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
        ambient_color = vec3(0.4,0.4,0.4) * vColor.rgb;
        to_light = uLightWorldPosition - vVertex;
        to_light = normalize(to_light);
        
        vertex_normal = normalize(vNormal);
        cos_angle = dot(vertex_normal, to_light);
        cos_angle = clamp(cos_angle, 0.0, 1.0);
        diffuse_color = vec3(vColor) * cos_angle;
        reflection = 2.0 * dot(vertex_normal,to_light) * vertex_normal - to_light;
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
   
        outputColor = vec4(color,vColor.a);
        
        // this simpler lighting model can be used for debugging normals
        /*
        vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
        float light = dot(vNormal, surfaceToLightDirection);
        outputColor = vColor;
        outputColor.rgb *= light;*/
    }
  `

function initShaderProgram(gl:WebGLRenderingContext) {
    const shaderProgram = compileShaderProgram(gl, vsSource, fsSource)
    if (!shaderProgram) { return null }

    return {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
            vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!,
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!,
            normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix")!,
            lightWorldPosition: gl.getUniformLocation(shaderProgram, "uLightWorldPosition")!,
            shininess: gl.getUniformLocation(shaderProgram, "uShininess")!
        },
    }
}

export function createShipsRenderer(gl:WebGLRenderingContext) {
    const programInfo = initShaderProgram(gl)!

    return function (projectionMatrix: mat4, localBubble: LocalBubble) {
        // Create a perspective matrix, a special matrix that is
        // used to simulate the distortion of perspective in a camera.
        // Our field of view is 45 degrees, with a width/height
        // ratio that matches the display size of the canvas
        // and we only want to see objects between 0.1 units
        // and 100 units away from the camera.

        gl.useProgram(programInfo.program);

        // Set the shader uniforms

        gl.uniform3fv(programInfo.uniformLocations.lightWorldPosition, localBubble.sun.position)
        //gl.uniform3fv(programInfo.uniformLocations.lightWorldPosition, [0,0,0]) // this puts the light at the player

        setViewUniformLocations(gl, programInfo,
            {
                projectionMatrix,
                lightWorldPosition: localBubble.sun.position
            })

        localBubble.ships.forEach(ship => {
            // Firstly we point the ship along the nose orientation
            const targetToMatrix = mat4.targetTo(mat4.create(), [0,0,0], ship.noseOrientation, ship.roofOrientation)
            const targetToQuat = mat4.getRotation(quat.create(), targetToMatrix)
            const viewPosition = ship.position
            const modelViewMatrix = mat4.fromRotationTranslation(mat4.create(), targetToQuat, viewPosition)
            const normalMatrix = mat4.create()
            mat4.invert(normalMatrix, modelViewMatrix)
            mat4.transpose(normalMatrix, normalMatrix)

            setCommonAttributes(gl, ship.blueprint.model, programInfo)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ship.blueprint.model.indices)
            setViewUniformLocations(gl, programInfo,
                {
                    modelViewMatrix,
                    normalMatrix,
                    shininess: ship.rendering.shininess
                }
            )

            {
                const vertexCount = ship.blueprint.model.vertexCount;
                const type = gl.UNSIGNED_SHORT;
                const offset = 0;
                gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
            }
        })
    }
}