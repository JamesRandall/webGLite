#version 300 es
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