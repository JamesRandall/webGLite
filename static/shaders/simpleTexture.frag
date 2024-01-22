#version 300 es
precision highp float;
in highp vec2 vTextureCoord;
uniform sampler2D uSampler;
out lowp vec4 outputColor;

void main(void) {
    vec4 tex = texture(uSampler, vTextureCoord);
    outputColor = tex;
}
