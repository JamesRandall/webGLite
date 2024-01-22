#version 300 es
in lowp vec4 vColor;

out lowp vec4 outputColor;
uniform highp float uDepth;

void main(void) {
    outputColor = vColor;
    gl_FragDepth = uDepth;
}
