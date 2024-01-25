#version 300 es
precision highp float;
in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 iResolution;
uniform float iTime;
out vec4 outputColor;

#define N 240.0
#define PI 3.14159265358979323

vec2 curve(vec2 uv)
{
    uv = (uv - 0.5) * 2.0;
    uv *= 1.1;
    uv.x *= 1.0 + pow((abs(uv.y) / 5.0), 2.0);
    uv.y *= 1.0 + pow((abs(uv.x) / 4.0), 2.0);
    uv  = (uv / 2.0) + 0.5;
    uv =  uv *0.92 + 0.04;
    return uv;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
    vec2 uv = fragCoord/iResolution.xy;
    uv = curve( uv );
    float scanLineNumber = floor(uv.y*N);
    float scanLineBrightness = sin(fract(uv.y*N)*PI);

    vec3 col;
    col = texture(uSampler, vec2(uv.x, scanLineNumber/N)).rgb;

    float vig = (0.0 + 1.0*16.0*uv.x*uv.y*(1.0-uv.x)*(1.0-uv.y));
    col *= vec3(pow(vig,0.2));

    col *= 1.0+0.01*sin(110.0*iTime);
    if (uv.x < 0.0 || uv.x > 1.0)
    col *= 0.0;
    if (uv.y < 0.0 || uv.y > 1.0)
    col *= 0.0;

    float inputBrightness = length(col); // length(texture(uSampler, vec2(uv.x, scanLineNumber/N)).rgb);
    fragColor = vec4(vec3(0.2, inputBrightness*0.74, 0.0), 1.0)*scanLineBrightness;
}

void main(void) {
    mainImage(outputColor, vTextureCoord*iResolution);
}
