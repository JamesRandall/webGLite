#version 300 es
// Created by Walter Jansen (2022-09-17)
precision highp float;
in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 iResolution;
uniform float iTime;
out vec4 outputColor;


#define SPEED 1.0
#define MUTATION_RATE 6.0
#define SEGMENTS 100.0
#define AMPLITUDE 0.9

// The MIT License
// Copyright © 2013 Inigo Quilez
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// https://www.youtube.com/c/InigoQuilez
// https://iquilezles.org

vec2 grad( ivec2 z )  // replace this anything that returns a random vector
{
    // 2D to 1D  (feel free to replace by some other)
    int n = z.x+z.y*11111;

    // Hugo Elias hash (feel free to replace by another one)
    n = (n<<13)^n;
    n = (n*(n*n*15731+789221)+1376312589)>>16;


    // Perlin style vectors
    n &= 7;
    vec2 gr = vec2(n&1,n>>1)*2.0-1.0;
    return ( n>=6 ) ? vec2(0.0,gr.x) :
    ( n>=4 ) ? vec2(gr.x,0.0) :
    gr;
}

float noise( in vec2 p )
{
    ivec2 i = ivec2(floor( p ));
    vec2 f =       fract( p );

    vec2 u = f*f*(3.0-2.0*f); // feel free to replace by a quintic smoothstep instead

    return mix( mix( dot( grad( i+ivec2(0,0) ), f-vec2(0.0,0.0) ),
                     dot( grad( i+ivec2(1,0) ), f-vec2(1.0,0.0) ), u.x),
                mix( dot( grad( i+ivec2(0,1) ), f-vec2(0.0,1.0) ),
                     dot( grad( i+ivec2(1,1) ), f-vec2(1.0,1.0) ), u.x), u.y);
}

float segDist(vec2 a, vec2 b, vec2 p)
{
    vec2 ab = b - a;
    vec2 ap = p - a;
    float h = dot(ab,ap)/dot(ab,ab);
    h = clamp(h,0.0,1.0);
    return (length(a + ab * h - p));
}

vec2 height(float v, float amp)
{
    float h = noise(vec2(v * 0.2, 1.2 + iTime * (MUTATION_RATE))) * 0.4 * amp;
    return (vec2(v, h));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    vec4 texColor = texture(uSampler, uv);
    float amp = AMPLITUDE;
    uv.x *= iResolution.x/iResolution.y;
    uv.y -= 0.5;

    float len = SEGMENTS;
    uv.x *= len;

    vec2 pos;
    float move = iTime * -(SPEED) * len;

    pos.x = uv.x + move;
    pos.x = floor(pos.x) + 0.5;
    pos = height(pos.x, amp);
    vec2 post = height(pos.x + 1.0, amp);
    vec2 pre  = height(pos.x - 1.0, amp);

    pos.x -= move;
    post.x -= move;
    pre.x -= move;

    float c = min(segDist(pos, post, uv), segDist(pos, pre, uv));
    c = (0.007/c) * smoothstep(0.3,0.0,c);

    vec3 col = vec3(1.7,1.7, 0.0) * c;

    fragColor = vec4(col,1.0) + texColor;

}

void main(void) {
    mainImage(outputColor, vTextureCoord*iResolution);
}
