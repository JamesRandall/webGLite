import { ShaderSource } from "./resources/resources"

export function loadShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`)
    gl.deleteShader(shader)
    return null
  }

  return shader
}

let shaderMap = new Map<string, WebGLProgram>()
export function compileShaderProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string) {
  const key = `${vsSource}:${fsSource}`
  let shaderProgram = shaderMap.get(key)
  if (!shaderProgram) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)!
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)!

    shaderProgram = gl.createProgram()!
    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`)
      return null
    }
    shaderMap.set(key, shaderProgram)
  }
  return shaderProgram
}

export function compileShaderProgram2(gl: WebGL2RenderingContext, source: ShaderSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, source.vert)!
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, source.frag)!

  const shaderProgram = gl.createProgram()!
  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`)
    return null
  }
  return shaderProgram
}
