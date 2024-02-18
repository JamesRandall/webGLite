import { RenderingModel } from "./models"
import { loadTexture } from "./texture"
import { createBoundingBox, getConstraints, getSizeFromConstraints, toVectorArray } from "../utilities"

class BufferArray {
  items: number[]
  numberOfComponents: number

  constructor(numberOfComponents: number, items?: number[]) {
    this.numberOfComponents = numberOfComponents
    this.items = items ?? []
  }

  get numberOfElements() {
    return this.items.length / this.numberOfComponents
  }

  push(values: number[]) {
    values.forEach((value) => this.items.push(value))
  }
}

interface ModelGeometry {
  positions: BufferArray
  normals: BufferArray
  texcoords: BufferArray
  indices: BufferArray
}

// This is based on the webglfundamentals.org example
function createSphereVertices(radius: number, subdivisionsAxis: number, subdivisionsHeight: number) {
  if (subdivisionsAxis <= 0 || subdivisionsHeight <= 0) {
    throw Error("subdivisionAxis and subdivisionHeight must be > 0")
  }

  const startLatitudeInRadians = 0
  const endLatitudeInRadians = Math.PI
  const startLongitudeInRadians = 0
  const endLongitudeInRadians = Math.PI * 2

  const latRange = endLatitudeInRadians - startLatitudeInRadians
  const longRange = endLongitudeInRadians - startLongitudeInRadians

  const positions = new BufferArray(3)
  const normals = new BufferArray(3)
  const texCoords = new BufferArray(2)

  // Generate the individual vertices in our vertex buffer.
  for (let y = 0; y <= subdivisionsHeight; y++) {
    for (let x = 0; x <= subdivisionsAxis; x++) {
      // Generate a vertex based on its spherical coordinates
      const u = x / subdivisionsAxis
      const v = y / subdivisionsHeight
      const theta = longRange * u + startLongitudeInRadians
      const phi = latRange * v + startLatitudeInRadians
      const sinTheta = Math.sin(theta)
      const cosTheta = Math.cos(theta)
      const sinPhi = Math.sin(phi)
      const cosPhi = Math.cos(phi)
      const ux = cosTheta * sinPhi
      const uy = cosPhi
      const uz = sinTheta * sinPhi
      positions.push([radius * ux, radius * uy, radius * uz])
      normals.push([ux, uy, uz])
      texCoords.push([1 - u, v])
    }
  }

  const numVertsAround = subdivisionsAxis + 1
  const indices = new BufferArray(3) // webglUtils.createAugmentedTypedArray(3, subdivisionsAxis * subdivisionsHeight * 2, Uint16Array);
  for (let x = 0; x < subdivisionsAxis; x++) {
    for (let y = 0; y < subdivisionsHeight; y++) {
      if (y === 0) {
        indices.push([(y + 0) * numVertsAround + x, (y + 1) * numVertsAround + x + 1, (y + 1) * numVertsAround + x])
      }
      if (y === subdivisionsHeight - 1) {
        indices.push([(y + 0) * numVertsAround + x, (y + 0) * numVertsAround + x + 1, (y + 1) * numVertsAround + x])
      }
      if (y > 0 && y < subdivisionsHeight - 1 && subdivisionsHeight > 2) {
        indices.push([(y + 0) * numVertsAround + x, (y + 1) * numVertsAround + x + 1, (y + 1) * numVertsAround + x])
        indices.push([(y + 0) * numVertsAround + x, (y + 0) * numVertsAround + x + 1, (y + 1) * numVertsAround + x + 1])
      }
    }
  }

  return {
    positions: positions,
    normals: normals,
    texcoords: texCoords,
    indices: indices,
  }
}

function createBuffers(gl: WebGL2RenderingContext, geometry: ModelGeometry): RenderingModel {
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.positions.items), gl.STATIC_DRAW)
  const normalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.normals.items), gl.STATIC_DRAW)
  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.indices.items), gl.STATIC_DRAW)
  //const colorBuffer = gl.createBuffer()
  //gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)
  const textureCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.texcoords.items), gl.STATIC_DRAW)

  const constraints = getConstraints(toVectorArray(geometry.positions.items))
  return {
    position: positionBuffer,
    color: 0,
    indices: indexBuffer,
    normals: normalBuffer,
    vertexCount: geometry.indices.items.length,
    textureCoords: textureCoordBuffer,
    texture: null,
    boundingBox: createBoundingBox(constraints),
    boundingBoxSize: getSizeFromConstraints(constraints),
    faceNormal: null,
  } as RenderingModel
}

export function createSphere(
  gl: WebGL2RenderingContext,
  options: {
    radius: number
    subdivisionsAxis: number
    subdivisionsHeight: number
    textureFile?: string
    glTexture?: WebGLTexture
  },
) {
  const geometry = createSphereVertices(options.radius, options.subdivisionsAxis, options.subdivisionsHeight)
  const texture = options.glTexture ?? (options.textureFile ? loadTexture(gl, options.textureFile) : null)
  const model = createBuffers(gl, geometry)
  model.texture = texture
  return model
}
