import {compileShaderProgram} from "../../shader";
import {LocalBubble} from "../../model/localBubble";
import {mat4, quat, vec2} from "gl-matrix";

// This handily shows how to get a shadertoy shader in:
//    https://webglfundamentals.org/webgl/lessons/webgl-shadertoy.html
// Made a start.

const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec4 aVertexColor;
    attribute vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec3 vLighting;
    varying lowp vec4 vColor;
    varying highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
      vTextureCoord = aTextureCoord;
      
      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      //highp vec3 directionalVector = normalize(vec3(-0.5, 0.8, 0.75));
      highp vec3 directionalVector = normalize(vec3(0.0, 0.0, -1.0));
      
      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `

/*
const fsSource = `#version 300 es
    in lowp vec4 vColor;
    in highp vec3 vLighting;
    
    out lowp vec4 outputColor;

    void main(void) {
      outputColor = vec4(vColor.rgb * vLighting, vColor.a);
    }
  `
*/


const fsSource = `
#define M_PI 3.14159265359
precision highp float;

varying lowp vec4 vColor;
varying highp vec3 vLighting;
varying highp vec2 vTextureCoord;

uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;
uniform sampler2D uSampler;

vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

//float mod(float a, float bb)==(a)-(floor((a)/(b))*(b))

vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
    return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
{ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    //   x0 = x0 - 0.0 + 0.0 * C.xxx;
    //   x1 = x0 - i1  + 1.0 * C.xxx;
    //   x2 = x0 - i2  + 2.0 * C.xxx;
    //   x3 = x0 - 1.0 + 3.0 * C.xxx;
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

    // Permutations
    i = mod289(i); 
    vec4 p = 
        permute
        (
            permute
            ( 
                permute
                (
                    i.z + vec4(0.0, i1.z, i2.z, 1.0)
                )
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 )
            )
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 )
        );

    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
    //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    //Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

// p: position
// o: how many layers
// f: frequency
// lac: how fast frequency changes between layers
// r: how fast amplitude changes between layers
float fbm4(vec3 p, float theta, float f, float lac, float r)
{
    mat3 mtx = mat3(
        cos(theta), -sin(theta), 0.0,
        sin(theta), cos(theta), 0.0,
        0.0, 0.0, 1.0);

    float frequency = f;
    float lacunarity = lac;
    float roughness = r;
    float amp = 1.0;
    float total_amp = 0.0;

    float accum = 0.0;
    vec3 X = p * frequency;
    for(int i = 0; i < 4; i++)
    {
        accum += amp * snoise(X);
        X *= (lacunarity + (snoise(X) + 0.1) * 0.006);
        X = mtx * X;

        total_amp += amp;
        amp *= roughness;
    }

    return accum / total_amp;
}


float turbulence(float val)
{
    float n = 1.0 - abs(val);
    return n * n;
}

float pattern(in vec3 p, inout vec3 q, inout vec3 r)
{
    q.x = fbm4( p + 0.0, 0.0, 1.0, 2.0, 0.33 );
    q.y = fbm4( p + 6.0, 0.0, 1.0, 2.0, 0.33 );

    r.x = fbm4( p + q - 2.4, 2.0, 1.0, 2.0, 0.5 );
    r.y = fbm4( p + q + 8.2, 02.0, 1.0, 2.0, 0.5 );

    q.x = turbulence( q.x );
    q.y = turbulence( q.y );

    float f = fbm4( p + (1.0 * r), 0.0, 1.0, 2.0, 0.5);

    return f;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 st = fragCoord.xy / iResolution.xy;
    float aspect = iResolution.x / iResolution.y;
    st.x *= aspect;

    vec2 uv = st;

    float t = iTime * 0.1;

    vec3 spectrum[4];
    spectrum[0] = vec3(1.00, 1.00, 0.00);
    spectrum[1] = vec3(0.50, 0.00, 0.00);
    spectrum[2] = vec3(1.00, 0.40, 0.20);
    spectrum[3] = vec3(1.00, 0.60, 0.00);

    uv -= 0.5;
    uv-=10.*iMouse.xy/ iResolution.xy;
    uv *= 30.;

    vec3 p = vec3(uv.x, uv.y, t);
    vec3 q = vec3(0.0);
    vec3 r = vec3(0.0);
    vec3 brigth_q = vec3(0.0);
    vec3 brigth_r = vec3(0.0);
    vec3 black_q = vec3(0.0);
    vec3 black_r = vec3(0.0);
    vec3 p2=vec3(p.xy*0.02,p.z*0.1);
    
    float black= pattern(p2 ,black_q ,black_r );
    black = smoothstep(0.9,0.1,length(black_q*black));
           
    float brigth= pattern( p2*2.,brigth_q ,brigth_r );
    brigth = smoothstep(0.0,0.8,brigth*length(brigth_q));

    p+=min(length(brigth_q) ,length(black_q)  )*5.;

    float f = pattern(p, q, r);

    vec3 color = vec3(0.0);
    color = mix(spectrum[1], spectrum[3], pow(length(q), 2.0));
    color = mix(color, spectrum[3], pow(length(r), 1.4));

    color = pow(color, vec3(2.0));

    fragColor =vec4( pow(black,2.)*(color +  spectrum[2]*brigth*5.), 1.0);
}

void main() {
  vec4 tex = texture2D(uSampler, vTextureCoord);
  if (tex.a < 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
  else {
    vec2 xy = vTextureCoord.xy * 256.0; //gl_FragCoord.xy; // / 2.0;
    mainImage(gl_FragColor, xy);
    //gl_FragColor = vec4(tex.r, tex.g, tex.b, 1.0);
  }
}
`

interface ProgramInfo {
  program: WebGLProgram,
  attribLocations: {
    vertexPosition: number,
    vertexNormal: number,
    vertexColor: number,
    textureCoords: number
  },
  uniformLocations: {
    projectionMatrix: WebGLUniformLocation,
    modelViewMatrix: WebGLUniformLocation,
    normalMatrix: WebGLUniformLocation,
    mouse: WebGLUniformLocation,
    resolution: WebGLUniformLocation,
    time: WebGLUniformLocation,
    sampler: WebGLUniformLocation
  }
}

function initShaderProgram(gl:WebGLRenderingContext) : ProgramInfo | null {
  const shaderProgram = compileShaderProgram(gl, vsSource, fsSource)
  if (!shaderProgram) { return null }

  return {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
      textureCoords: gl.getAttribLocation(shaderProgram, "aTextureCoord")
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!,
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!,
      normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix")!,
      mouse: gl.getUniformLocation(shaderProgram, "iMouse")!,
      time: gl.getUniformLocation(shaderProgram, "iTime")!,
      resolution: gl.getUniformLocation(shaderProgram, "iResolution")!,
      sampler: gl.getUniformLocation(shaderProgram, "uSampler")!
    },
  }
}

function setNormalAttribute(gl:WebGLRenderingContext, buffers:any, programInfo:ProgramInfo) {
  const numComponents = 3
  const type = gl.FLOAT
  const normalize = false
  const stride = 0
  const offset = 0
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals)
  gl.vertexAttribPointer(
      programInfo.attribLocations.vertexNormal,
      numComponents,
      type,
      normalize,
      stride,
      offset,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal)
}


function setTextureAttribute(gl:WebGLRenderingContext, buffers:any, programInfo:ProgramInfo) {
  const num = 2 // every coordinate composed of 2 values
  const type = gl.FLOAT // the data in the buffer is 32-bit float
  const normalize = false // don't normalize
  const stride = 0 // how many bytes to get from one set to the next
  const offset = 0 // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoords)
  gl.vertexAttribPointer(
      programInfo.attribLocations.textureCoords,
      num,
      type,
      normalize,
      stride,
      offset,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.textureCoords);
}


function setColorAttribute(gl:WebGLRenderingContext, buffers:any, programInfo:ProgramInfo) {
  const numComponents = 4
  const type = gl.FLOAT
  const normalize = false
  const stride = 0
  const offset = 0
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color)
  gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset,
  )
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor)
}

function setPositionAttribute(gl:WebGLRenderingContext, buffers:any, programInfo:ProgramInfo) {
  const numComponents = 3; // pull out 2 values per iteration
  const type = gl.FLOAT; // the data in the buffer is 32bit floats
  const normalize = false; // don't normalize
  const stride = 0; // how many bytes to get from one set of values to the next
  // 0 = use type and numComponents above
  const offset = 0; // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

export function createSunRenderer(gl:WebGLRenderingContext) {
  const programInfo = initShaderProgram(gl)!

  let time = 0.0

  return function (localBubble: LocalBubble, timeDelta: number) {
    time += timeDelta

    const canvas = gl.canvas as HTMLCanvasElement
    const fieldOfView = (45 * Math.PI) / 180 // in radians
    const aspect = canvas.clientWidth / canvas.clientHeight
    const zNear = 0.1
    const zFar = localBubble.clipSpaceRadius*1.2
    const projectionMatrix = mat4.create()
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

    gl.useProgram(programInfo.program);

    // Set the shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix,
    )

    const sun = localBubble.sun
    const targetToMatrix = mat4.targetTo(mat4.create(), [0,0,0], sun.noseOrientation, sun.roofOrientation)
    const targetToQuat = mat4.getRotation(quat.create(), targetToMatrix)
    const modelViewMatrix = mat4.fromRotationTranslationScale(mat4.create(), targetToQuat, sun.position,[120.0,120.0,1.0])
    const normalMatrix = mat4.create()
    mat4.invert(normalMatrix, modelViewMatrix)
    mat4.transpose(normalMatrix, normalMatrix)
    const resolution = vec2.fromValues(256.0,256.0)
    const mouse = vec2.fromValues(32,32)

    setPositionAttribute(gl, sun.model, programInfo)
    setColorAttribute(gl, sun.model, programInfo)
    setNormalAttribute(gl, sun.model, programInfo)
    setTextureAttribute(gl, sun.model, programInfo)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sun.model.indices)
    // Tell WebGL to use our program when drawing
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix,
    )
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.normalMatrix,
        false,
        normalMatrix,
    )

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, localBubble.sun.model.texture)
    gl.uniform1i(programInfo.uniformLocations.sampler, 0)

    gl.uniform2fv(programInfo.uniformLocations.mouse, mouse)
    gl.uniform2fv(programInfo.uniformLocations.resolution, resolution)
    gl.uniform1f(programInfo.uniformLocations.time, time)


    {
      const vertexCount = sun.model.vertexCount;
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
  }
}