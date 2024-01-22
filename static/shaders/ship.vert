#version 300 es
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