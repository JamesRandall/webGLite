import { vec2, vec3, vec4 } from "gl-matrix"
import { loadTexture } from "./texture"
import { createBoundingBox, getConstraints, getSizeFromConstraints } from "../utilities"

export interface RenderingModel {
  position: WebGLBuffer
  color: WebGLBuffer
  indices: WebGLBuffer
  normals: WebGLBuffer
  textureCoords: WebGLBuffer
  texture: WebGLTexture | null
  vertexCount: number
  boundingBox: vec3[]
  boundingBoxSize: vec3
  faceNormal: vec3 | null
}

const materials: { [key: string]: number[] } = {
  darkgray: [0.2, 0.2, 0.2, 1.0],
  gray: [0.6, 0.6, 0.6, 1.0],
  orange: [0xf5 / 255.0, 0x9e / 255.0, 0x0b / 255.0, 1.0],
  lightblue: [0x7d / 255.0, 0xd3 / 255.0, 0xfd / 255.0, 1.0],
  red: [1.0, 0.0, 0.0, 1.0],
  green: [0.0, 1.0, 0.0, 1.0],
  yellow: [1.0, 1.0, 0.0, 1.0],
  black: [0.0, 0.0, 0.0, 1.0],
}

interface FaceVertex {
  vertexIndex: number
  textureIndex: number | null
  normalIndex: number | null
}

function extractFromWrl(
  lines: string[],
  scale: number,
  vertices: vec3[],
  faceIndices: FaceVertex[][],
  materialChanges: string[],
  vertexNormals: vec3[],
  vertexTextures: vec2[],
) {
  let isReadingFaceInidcies = false
  let isReadingCoords = false
  lines.forEach((line) => {
    const trimmedLine = line.trim()
    if (trimmedLine.indexOf("coordIndex [") > -1) {
      isReadingFaceInidcies = true
    } else if (isReadingFaceInidcies) {
      if (trimmedLine.indexOf("]") > -1) {
        isReadingFaceInidcies = false
      } else {
        const components = trimmedLine
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== "" && s !== "-1")
        // ignore more complex shapes for now
        const newFace = components.reverse().map((index) => {
          return {
            vertexIndex: parseInt(index),
            textureIndex: null,
            normalIndex: null,
          }
        })
        faceIndices.push(newFace)
      }
    } else if (trimmedLine.indexOf("coord Coordinate { point [") > -1) {
      isReadingCoords = true
    } else if (isReadingCoords) {
      if (trimmedLine.indexOf("]") > -1) {
        isReadingCoords = false
      } else {
        const components = trimmedLine.replace(",", "").split(" ")
        const newVector = vec3.fromValues(
          parseFloat(components[0]) * scale,
          parseFloat(components[1]) * scale,
          parseFloat(components[2]) * scale,
        )
        vertices.push(newVector)
      }
    }
  })
}

function extractFromObj(
  lines: string[],
  scale: number,
  vertices: vec3[],
  faceIndices: FaceVertex[][],
  materialChanges: string[],
  vertexNormals: vec3[],
  vertexTextures: vec2[],
) {
  lines.forEach((line) => {
    const components = line.split(" ")
    if (components.length > 0) {
      if (components[0] == "v") {
        const newVector = vec3.fromValues(
          parseFloat(components[1]) * scale,
          parseFloat(components[2]) * scale,
          parseFloat(components[3]) * scale,
        )
        vertices.push(newVector)
      } else if (components[0] == "f") {
        // Face can be in the formats:
        // f 1 2 3              indices for positions only
        // f 1/1 2/2 3/3        indices for positions and texcoords
        // f 1/1/1 2/2/2 3/3/3  indices for positions, texcoords, and normals
        // f 1//1 2//2 3//3     indices for positions and normals
        // Currently we deal with format f 1 2 3 and format f 1/1/1 2/2/2 3/3/3
        const newFace = components.slice(1).map((c) => {
          if (c.indexOf("/") > 0) {
            let fc = c.split("/")
            return {
              vertexIndex: parseInt(fc[0]) - 1,
              textureIndex: parseInt(fc[1]) - 1,
              normalIndex: parseInt(fc[2]) - 1,
            }
          }
          return {
            vertexIndex: parseInt(c) - 1,
            textureIndex: null,
            normalIndex: null,
          }
        })
        faceIndices.push(newFace)
      } else if (components[0] == "usemtl") {
        //materialChanges.push({faceIndex: faceIndices.length, material: components[1]})
        if (materials[components[1]]) {
          // if we have the material mapped
          materialChanges[faceIndices.length] = components[1]
        }
      } else if (components[0] == "vn") {
        const newNormal = vec3.fromValues(
          parseFloat(components[1]),
          parseFloat(components[2]),
          parseFloat(components[3]),
        )
        vertexNormals.push(newNormal)
      } else if (components[0] === "vt") {
        const newVertexTexture = vec2.fromValues(parseFloat(components[1]), parseFloat(components[2]))
        vertexTextures.push(newVertexTexture)
      }
    }
  })
}

export async function loadRawModel(path: string, scale: number) {
  const response = await fetch(path)
  const text = await response.text()
  const lines = text.split("\n")
  let vertices: vec3[] = []
  let vertexNormals: vec3[] = []
  const vertexTextures: vec2[] = []
  const faceIndices: FaceVertex[][] = []
  //const materialChanges:{[faceIndex:number], material:string}[] = []
  const materialChanges: string[] = []

  if (path.endsWith(".obj")) {
    extractFromObj(lines, scale, vertices, faceIndices, materialChanges, vertexNormals, vertexTextures)
  } else if (path.endsWith(".wrl")) {
    extractFromWrl(lines, scale, vertices, faceIndices, materialChanges, vertexNormals, vertexTextures)
  }

  // Our models all have the nose pointing the wrong way so we rotate them as we load
  vertices = vertices.map((v) => vec3.rotateY(vec3.create(), v, [0, 0, 0], Math.PI))
  vertexNormals = vertexNormals.map((v) => vec3.rotateY(vec3.create(), v, [0, 0, 0], Math.PI))

  let currentColor = materials.gray
  const faces = faceIndices.flatMap((face, index) => {
    const numberOfTriangles = face.length - 2
    const subFaces = []
    const newMaterial = materialChanges[index]
    if (newMaterial) {
      currentColor = materials[newMaterial]
    }
    for (let subFaceIndex = 0; subFaceIndex < numberOfTriangles; subFaceIndex++) {
      //const faceVertices = face.slice(subFaceIndex,subFaceIndex+3).map(index => vertices[index-1])
      const faceVertices = [
        vertices[face[0].vertexIndex],
        vertices[face[subFaceIndex + 1].vertexIndex],
        vertices[face[subFaceIndex + 2].vertexIndex],
      ]
      let normals: vec3[] = []
      if (face[0].normalIndex !== null) {
        normals = [
          vertexNormals[face[0].normalIndex],
          vertexNormals[face[subFaceIndex + 1].normalIndex!],
          vertexNormals[face[subFaceIndex + 2].normalIndex!],
        ]
      } else {
        // If the model doesn't contain a normal then we calculate it
        // The normal of a triangle is the cross-product of two edges of the triangle, normalised for the lighting
        const edge1 = vec3.create()
        const edge2 = vec3.create()
        const normal = vec3.create()

        if (faceVertices.length < 3) debugger

        vec3.subtract(edge1, faceVertices[0], faceVertices[1])
        vec3.subtract(edge2, faceVertices[1], faceVertices[2])
        vec3.cross(normal, edge1, edge2)
        vec3.normalize(normal, normal)
        normals = [normal, normal, normal]
      }
      subFaces.push({ vertices: faceVertices, normals: normals, color: currentColor })
    }
    return subFaces
  })
  return { vertices, faces }
}

export async function loadExplosionFromModel(gl: WebGL2RenderingContext, path: string, scale: number = 1.0) {
  const { vertices, faces } = await loadRawModel(path, scale)
  const models = faces.map((face) => {
    const positions = face.vertices.flatMap((v) => [v[0], v[1], v[2]])
    const normals = face.normals.flatMap((fn) => [fn[0], fn[1], fn[2]])
    const indices = [0, 1, 2]
    const colors = face.vertices.flatMap((_) => face.color)

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
    const normalBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW)
    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
    const colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

    let constraints = getConstraints(face.vertices)

    return {
      position: positionBuffer,
      color: colorBuffer,
      indices: indexBuffer,
      normals: normalBuffer,
      vertexCount: indices.length,
      textureCoords: 0,
      texture: null,
      boundingBox: createBoundingBox(constraints),
      boundingBoxSize: getSizeFromConstraints(constraints),
      faceNormal: face.normals[0],
    } as RenderingModel
  })
  return models
}

export async function loadModel(gl: WebGL2RenderingContext, path: string, scale: number = 1.0) {
  const { vertices, faces } = await loadRawModel(path, scale)

  const positions = faces.flatMap((face) => face.vertices.flatMap((v) => [v[0], v[1], v[2]])) // v.entries()
  const normals = faces.flatMap((face) => face.normals.flatMap((fn) => [fn[0], fn[1], fn[2]])) // v.entries()
  const indices = faces.flatMap((_, index) => [index * 3, index * 3 + 1, index * 3 + 2])

  const colors = faces.flatMap((face, index) => {
    return face.vertices.flatMap((_) => face.color)
  })

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
  const normalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW)
  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
  const colorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

  let constraints = getConstraints(vertices)

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
    normals: normalBuffer,
    vertexCount: indices.length,
    textureCoords: 0,
    texture: null,
    boundingBox: createBoundingBox(constraints),
    boundingBoxSize: getSizeFromConstraints(constraints),
    faceNormal: null,
  } as RenderingModel
}

export function createSquareModel(
  gl: WebGL2RenderingContext,
  color: vec4,
  customPositions: number[] | null = null,
  flippedTexCoords: boolean = false,
) {
  const positions =
    customPositions === null ? [-1.0, -1.0, 0.0, 1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, 1.0, 0.0] : customPositions
  const normals = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0]
  const indices = [0, 1, 2, 0, 2, 3]
  const textureCoords = flippedTexCoords
    ? [0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0]
    : [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]

  const colors = [
    color[0],
    color[1],
    color[2],
    color[3],
    color[0],
    color[1],
    color[2],
    color[3],
    color[0],
    color[1],
    color[2],
    color[3],
    color[0],
    color[1],
    color[2],
    color[3],
  ]

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
  const normalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW)
  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
  const colorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)
  const textureCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW)

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
    normals: normalBuffer,
    vertexCount: indices.length,
    textureCoords: textureCoordBuffer,
    texture: null,
  } as RenderingModel
}

/*
export function createSquareModelWithTexture(
  gl: WebGL2RenderingContext,
  texture: string,
  flipY: boolean = true,
  topLeftBased = false,
  smoothScaling: boolean = false,
) {
  const positions = !topLeftBased
    ? [-1.0, -1.0, 0.0, 1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, 1.0, 0.0]
    : [0, 0, 0, 2, 0, 0, 2, 2, 0, 0, 2, 0]
  const normals = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0]
  const indices = [0, 1, 2, 0, 2, 3]
  const textureCoords = flipY ? [0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0] : [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]

  const color = [1.0, 1.0, 1.0, 1.0]
  const colors = [
    color[0],
    color[1],
    color[2],
    color[3],
    color[0],
    color[1],
    color[2],
    color[3],
    color[0],
    color[1],
    color[2],
    color[3],
    color[0],
    color[1],
    color[2],
    color[3],
  ]

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
  const normalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW)
  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
  const colorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)
  const textureCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW)
  const glTexture = loadTexture(gl, texture, smoothScaling)

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
    normals: normalBuffer,
    vertexCount: indices.length,
    textureCoords: textureCoordBuffer,
    texture: glTexture,
  } as Model
}*/

export function createSquareModelWithLoadedTexture(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  flipY: boolean = true,
  topLeftBased = false,
  smoothScaling: boolean = false,
) {
  const positions = !topLeftBased
    ? [-1.0, -1.0, 0.0, 1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, 1.0, 0.0]
    : [0, 0, 0, 2, 0, 0, 2, 2, 0, 0, 2, 0]
  const normals = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0]
  const indices = [0, 1, 2, 0, 2, 3]
  const textureCoords = flipY ? [0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0] : [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]
  //[0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]

  const color = [1.0, 1.0, 1.0, 1.0]
  const colors = [
    color[0],
    color[1],
    color[2],
    color[3],
    color[0],
    color[1],
    color[2],
    color[3],
    color[0],
    color[1],
    color[2],
    color[3],
    color[0],
    color[1],
    color[2],
    color[3],
  ]

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
  const normalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW)
  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
  const colorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)
  const textureCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW)

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
    normals: normalBuffer,
    vertexCount: indices.length,
    textureCoords: textureCoordBuffer,
    texture: texture,
  } as RenderingModel
}
