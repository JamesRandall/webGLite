#version 300 es
in vec3 position;

uniform mat4 uProjectionMatrix;
uniform highp float uDepth;

out vec4 vColor;

void main() {
    vColor = vec4(1.0-position.z, 1.0-position.z, 1.0-position.z, 1.0);
    gl_PointSize = 4.0 * (1.0 - position.z); //size * ( 300.0 / length( mvPosition.xyz ) );
    gl_Position = uProjectionMatrix * vec4(position.xy,-uDepth,1.0);
}
