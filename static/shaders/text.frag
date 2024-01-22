#version 300 es
precision highp float;
in lowp vec4 vColor;
in highp vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec4 uColor;

out lowp vec4 outputColor;

void main(void) {
    vec4 tex = texture(uSampler, vTextureCoord);
    if (tex.r > 0.0 || tex.g > 0.0 || tex.b > 0.0) {
        outputColor = uColor;
    }
    else {
        outputColor = vec4(0.0,0.0,0.0,0.0);
    }
}
