#version 300 es
precision highp float;
in vec4 aVertexPosition;
in vec4 aVertexColor;
in vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uCharacterOffset;

out lowp vec4 vColor;
out highp vec2 vTextureCoord;

void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;
    // pick out the character from the texture set
    float characterSpacing = 1.0 / 96.0; // 96 characters in the strip
    float characterSize = (1.0 / 1536.0) * 7.0;
    vTextureCoord = vec2((characterSpacing * uCharacterOffset) + aTextureCoord.x * characterSize, aTextureCoord.y);
}