import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  assertValidGeometry,
  createBox,
  createCylinder,
  createGear,
  createPlane,
  createSphere,
  createTorus,
  createTube,
  MAX_UINT16_VERTICES,
  mergeGeometries,
} from './primitives.js'

const EPS = 1e-4

function bounds(geometry) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let k = 0; k < geometry.positions.length; k += 3) {
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], geometry.positions[k + a])
      max[a] = Math.max(max[a], geometry.positions[k + a])
    }
  }
  return { min, max }
}

function assertClose(actual, expected, message, eps = EPS) {
  assert.ok(Math.abs(actual - expected) <= eps, `${message}: ${actual} ≠ ${expected}`)
}

function assertBounds(geometry, expectedMin, expectedMax, label) {
  const { min, max } = bounds(geometry)
  for (let a = 0; a < 3; a++) {
    assertClose(min[a], expectedMin[a], `${label} min[${a}]`)
    assertClose(max[a], expectedMax[a], `${label} max[${a}]`)
  }
}

/** Índices en rango, normales unitarias y UV finitas. */
function assertWellFormed(geometry, label) {
  assertValidGeometry(geometry, label)
  const vertexCount = geometry.positions.length / 3
  for (const index of geometry.indices) assert.ok(index < vertexCount, `${label}: índice ${index} fuera de rango`)
  for (let v = 0; v < vertexCount; v++) {
    const len = Math.hypot(geometry.normals[v * 3], geometry.normals[v * 3 + 1], geometry.normals[v * 3 + 2])
    assertClose(len, 1, `${label}: normal ${v} no unitaria`, 1e-3)
  }
  for (const value of geometry.uvs) assert.ok(Number.isFinite(value), `${label}: UV no finita`)
}

/**
 * Sentido antihorario hacia fuera: la normal geométrica de cada triángulo no degenerado debe coincidir
 * con la media de las normales de sus vértices (que apuntan hacia fuera).
 */
function assertOutwardWinding(geometry, label) {
  const { positions, normals, indices } = geometry
  let checked = 0
  for (let t = 0; t < indices.length; t += 3) {
    const [i0, i1, i2] = [indices[t], indices[t + 1], indices[t + 2]]
    const p = (i) => [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]]
    const [a, b, c] = [p(i0), p(i1), p(i2)]
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    const cross = [
      e1[1] * e2[2] - e1[2] * e2[1],
      e1[2] * e2[0] - e1[0] * e2[2],
      e1[0] * e2[1] - e1[1] * e2[0],
    ]
    const area = Math.hypot(...cross)
    if (area < 1e-9) continue
    const avg = [0, 0, 0]
    for (const i of [i0, i1, i2]) for (let k = 0; k < 3; k++) avg[k] += normals[i * 3 + k]
    const dot = (cross[0] * avg[0] + cross[1] * avg[1] + cross[2] * avg[2]) / area
    assert.ok(dot > 0.2, `${label}: triángulo ${t / 3} con orientación invertida (dot ${dot.toFixed(3)})`)
    checked++
  }
  assert.ok(checked > 0, `${label}: sin triángulos comprobables`)
}

/** Para sólidos convexos: la normal geométrica mira lejos del centro. */
function assertFacesAwayFromCenter(geometry, center, label) {
  const { positions, indices } = geometry
  for (let t = 0; t < indices.length; t += 3) {
    const a = [0, 1, 2].map((k) => positions[indices[t] * 3 + k])
    const b = [0, 1, 2].map((k) => positions[indices[t + 1] * 3 + k])
    const c = [0, 1, 2].map((k) => positions[indices[t + 2] * 3 + k])
    const e1 = b.map((v, k) => v - a[k])
    const e2 = c.map((v, k) => v - a[k])
    const cross = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
    if (Math.hypot(...cross) < 1e-9) continue
    const centroid = a.map((v, k) => (v + b[k] + c[k]) / 3 - center[k])
    const dot = cross[0] * centroid[0] + cross[1] * centroid[1] + cross[2] * centroid[2]
    assert.ok(dot > 0, `${label}: triángulo ${t / 3} mira hacia el interior`)
  }
}

describe('createBox', () => {
  it('genera 24 vértices y 36 índices con caja delimitadora exacta', () => {
    const box = createBox({ width: 2, height: 1, depth: 3 })
    assert.equal(box.positions.length / 3, 24)
    assert.equal(box.indices.length, 36)
    assert.ok(box.indices instanceof Uint16Array)
    assertWellFormed(box, 'box')
    assertBounds(box, [-1, -0.5, -1.5], [1, 0.5, 1.5], 'box')
    assertOutwardWinding(box, 'box')
    assertFacesAwayFromCenter(box, [0, 0, 0], 'box')
  })

  it('usa la convención UV de glTF (v = 0 arriba) en la cara frontal', () => {
    const box = createBox()
    // Cara +Z: últimos 4 vértices con z = +0.5; el vértice superior izquierdo tiene uv (0,0)
    const front = [16, 17, 18, 19]
    const topLeft = front.find((i) => box.positions[i * 3] < 0 && box.positions[i * 3 + 1] > 0)
    assert.deepEqual([box.uvs[topLeft * 2], box.uvs[topLeft * 2 + 1]], [0, 0])
  })
})

describe('createPlane', () => {
  it('mira a +Z y cuenta vértices según la subdivisión', () => {
    const plane = createPlane({ width: 4, height: 2, widthSegments: 3, heightSegments: 2 })
    assert.equal(plane.positions.length / 3, 4 * 3)
    assert.equal(plane.indices.length, 3 * 2 * 6)
    assertWellFormed(plane, 'plane')
    assertBounds(plane, [-2, -1, 0], [2, 1, 0], 'plane')
    assertOutwardWinding(plane, 'plane')
    assert.deepEqual([plane.normals[0], plane.normals[1], plane.normals[2]], [0, 0, 1])
  })
})

describe('createSphere', () => {
  it('omite los triángulos degenerados de los polos', () => {
    const sphere = createSphere({ radius: 2, widthSegments: 8, heightSegments: 4 })
    assert.equal(sphere.positions.length / 3, 9 * 5)
    assert.equal(sphere.indices.length, 8 * (2 * 4 - 2) * 3)
    assertWellFormed(sphere, 'sphere')
    assertBounds(sphere, [-2, -2, -2], [2, 2, 2], 'sphere')
    assertOutwardWinding(sphere, 'sphere')
    assertFacesAwayFromCenter(sphere, [0, 0, 0], 'sphere')
  })

  it('cambia a Uint32 al superar los 65535 vértices', () => {
    const large = createSphere({ widthSegments: 255, heightSegments: 255 })
    assert.equal(large.positions.length / 3, 256 * 256)
    assert.ok(large.positions.length / 3 > MAX_UINT16_VERTICES)
    assert.ok(large.indices instanceof Uint32Array)
    assertValidGeometry(large, 'sphere-grande')
    const fine = createSphere({ widthSegments: 200, heightSegments: 200 })
    assert.ok(fine.positions.length / 3 <= MAX_UINT16_VERTICES)
    assert.ok(fine.indices instanceof Uint16Array)
  })
})

describe('createCylinder', () => {
  it('con tapas: pared + dos discos, centrado en Y', () => {
    const cyl = createCylinder({ radiusTop: 0.5, radiusBottom: 1, height: 2, radialSegments: 8 })
    assert.equal(cyl.positions.length / 3, 9 * 2 + 2 * 9)
    assert.equal(cyl.indices.length, (8 * 2 + 8 + 8) * 3)
    assertWellFormed(cyl, 'cylinder')
    assertBounds(cyl, [-1, -1, -1], [1, 1, 1], 'cylinder')
    assertOutwardWinding(cyl, 'cylinder')
    assertFacesAwayFromCenter(cyl, [0, 0, 0], 'cylinder')
  })

  it('sin tapas y con radio superior 0 (cono)', () => {
    const open = createCylinder({ radialSegments: 8, capTop: false, capBottom: false })
    assert.equal(open.positions.length / 3, 18)
    assert.equal(open.indices.length, 8 * 2 * 3)

    const cone = createCylinder({ radiusTop: 0, radiusBottom: 1, height: 2, radialSegments: 8 })
    assert.equal(cone.indices.length, (8 + 8) * 3, 'cono: 8 de pared + 8 de la tapa inferior')
    assertWellFormed(cone, 'cone')
    assertOutwardWinding(cone, 'cone')
    // Inclinación de la pared: la normal de un cono de r=1, h=2 tiene componente Y > 0
    assert.ok(cone.normals[1] > 0)
  })
})

describe('createTorus', () => {
  it('eje Y, vértices (ts+1)(rs+1) y sentido hacia fuera', () => {
    const torus = createTorus({ radius: 1, tube: 0.25, radialSegments: 8, tubularSegments: 12 })
    assert.equal(torus.positions.length / 3, 13 * 9)
    assert.equal(torus.indices.length, 12 * 8 * 2 * 3)
    assertWellFormed(torus, 'torus')
    assertBounds(torus, [-1.25, -0.25, -1.25], [1.25, 0.25, 1.25], 'torus')
    assertOutwardWinding(torus, 'torus')
  })
})

describe('createTube', () => {
  it('recorrido recto sobre X con tapas', () => {
    const tube = createTube({
      path: [
        [0, 0, 0],
        [1, 0, 0],
        [2, 0, 0],
      ],
      radius: 0.1,
      radialSegments: 8,
    })
    assert.equal(tube.positions.length / 3, 3 * 9 + 2 * 9)
    assert.equal(tube.indices.length, (2 * 8 * 2 + 2 * 8) * 3)
    assertWellFormed(tube, 'tube')
    assertBounds(tube, [0, -0.1, -0.1], [2, 0.1, 0.1], 'tube')
    assertOutwardWinding(tube, 'tube')
  })

  it('sin tapas cuenta solo la pared y descarta puntos repetidos', () => {
    const tube = createTube({
      path: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
      ],
      radialSegments: 5,
      capEnds: false,
    })
    assert.equal(tube.positions.length / 3, 2 * 6)
    assert.equal(tube.indices.length, 5 * 2 * 3)
  })

  it('en una hélice mantiene la sección circular y el marco sin saltos', () => {
    const turns = 3
    const steps = 120
    const helixRadius = 1
    const tubeRadius = 0.08
    const radialSegments = 8
    const path = Array.from({ length: steps + 1 }, (_, k) => {
      const t = (k / steps) * turns * Math.PI * 2
      return [helixRadius * Math.cos(t), (k / steps) * 3, helixRadius * Math.sin(t)]
    })
    const tube = createTube({ path, radius: tubeRadius, radialSegments, capEnds: false })
    assertWellFormed(tube, 'helix')
    assertOutwardWinding(tube, 'helix')
    const stride = radialSegments + 1
    let previous = null
    for (let k = 0; k <= steps; k++) {
      const v = k * stride
      const p = path[k]
      const offset = [0, 1, 2].map((a) => tube.positions[v * 3 + a] - p[a])
      assertClose(Math.hypot(...offset), tubeRadius, `distancia al eje en el anillo ${k}`, 1e-4)
      const n = [0, 1, 2].map((a) => offset[a] / tubeRadius)
      if (previous) {
        const dot = n[0] * previous[0] + n[1] * previous[1] + n[2] * previous[2]
        assert.ok(dot > 0.95, `el marco gira bruscamente en el anillo ${k} (dot ${dot.toFixed(3)})`)
      }
      previous = n
    }
  })

  it('falla con un mensaje claro si el recorrido no sirve', () => {
    assert.throws(() => createTube({ path: [[0, 0, 0]] }), /al menos 2 puntos/)
    assert.throws(() => createTube({}), /al menos 2 puntos/)
  })
})

describe('createGear', () => {
  it('macizo: grosor en Y, radio exterior en XZ y recuento esperado', () => {
    const gear = createGear({ teeth: 8, outerRadius: 1, rootRadius: 0.8, thickness: 0.4 })
    assert.equal(gear.positions.length / 3, 32 * 4 + 2 * 33)
    assert.equal(gear.indices.length, (32 * 2 + 2 * 32) * 3)
    assertWellFormed(gear, 'gear')
    const { min, max } = bounds(gear)
    assertClose(min[1], -0.2, 'gear y mín')
    assertClose(max[1], 0.2, 'gear y máx')
    assert.ok(max[0] <= 1 + EPS && max[2] <= 1 + EPS && min[0] >= -1 - EPS && min[2] >= -1 - EPS)
    let maxRadius = 0
    for (let k = 0; k < gear.positions.length; k += 3) {
      maxRadius = Math.max(maxRadius, Math.hypot(gear.positions[k], gear.positions[k + 2]))
    }
    assertClose(maxRadius, 1, 'las puntas llegan al radio exterior')
    assertOutwardWinding(gear, 'gear')
  })

  it('con taladro: pared interior hacia el eje y caras anulares', () => {
    const gear = createGear({ teeth: 8, outerRadius: 1, thickness: 0.4, boreRadius: 0.25 })
    assert.equal(gear.positions.length / 3, 32 * 4 + 2 * 64 + 32 * 4)
    assert.equal(gear.indices.length, (32 * 2 + 2 * 32 * 2 + 32 * 2) * 3)
    assertWellFormed(gear, 'gear-bore')
    assertOutwardWinding(gear, 'gear-bore')
    // Ningún vértice de la pared del taladro queda dentro del radio del taladro
    for (let k = 0; k < gear.positions.length; k += 3) {
      assert.ok(Math.hypot(gear.positions[k], gear.positions[k + 2]) >= 0.25 - EPS)
    }
  })
})

describe('mergeGeometries', () => {
  it('concatena desplazando los índices de cada parte', () => {
    const a = createBox()
    const b = createSphere({ widthSegments: 8, heightSegments: 4 })
    const merged = mergeGeometries([{ geometry: a }, { geometry: b }])
    assert.equal(merged.positions.length / 3, 24 + 45)
    assert.equal(merged.indices.length, a.indices.length + b.indices.length)
    assert.equal(merged.indices[a.indices.length], b.indices[0] + 24)
    assert.deepEqual([...merged.positions.slice(24 * 3)], [...b.positions])
    assertWellFormed(merged, 'merge')
  })

  it('aplica la matriz a posiciones y a normales con escala no uniforme', () => {
    // Elipsoide: escala (2,1,1) y desplazamiento en X
    const matrix = new Float32Array([2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 0, 0, 1])
    const sphere = createSphere({ radius: 1, widthSegments: 16, heightSegments: 8 })
    const merged = mergeGeometries([{ geometry: sphere, matrix }])
    assertBounds(merged, [3, -1, -1], [7, 1, 1], 'elipsoide')
    for (let v = 0; v < merged.positions.length / 3; v++) {
      const x = (merged.positions[v * 3] - 5) / 4 // gradiente de x²/4 + y² + z² = 1
      const y = merged.positions[v * 3 + 1]
      const z = merged.positions[v * 3 + 2]
      const len = Math.hypot(x, y, z)
      assertClose(merged.normals[v * 3], x / len, 'nx', 1e-3)
      assertClose(merged.normals[v * 3 + 1], y / len, 'ny', 1e-3)
      assertClose(merged.normals[v * 3 + 2], z / len, 'nz', 1e-3)
    }
    assertOutwardWinding(merged, 'elipsoide')
  })

  it('una reflexión invierte los triángulos para que sigan mirando hacia fuera', () => {
    const mirror = new Float32Array([-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
    const merged = mergeGeometries([{ geometry: createBox(), matrix: mirror }])
    assertOutwardWinding(merged, 'espejo')
    assertFacesAwayFromCenter(merged, [0, 0, 0], 'espejo')
  })

  it('promociona a índices de 32 bits cuando la suma supera el límite', () => {
    const big = createSphere({ widthSegments: 200, heightSegments: 200 })
    assert.ok(big.indices instanceof Uint16Array)
    const merged = mergeGeometries([{ geometry: big }, { geometry: big }])
    assert.ok(merged.indices instanceof Uint32Array)
    assert.equal(merged.positions.length / 3, 2 * 201 * 201)
    assert.equal(merged.indices[big.indices.length], big.indices[0] + 201 * 201)
    assertValidGeometry(merged, 'merge-grande')
  })

  it('rechaza listas vacías y geometrías mal formadas', () => {
    assert.throws(() => mergeGeometries([]), /al menos una/)
    assert.throws(() => mergeGeometries([{ geometry: { positions: new Float32Array(3) } }]), /mergeGeometries\[0\]/)
  })
})

describe('assertValidGeometry', () => {
  it('detecta índices fuera de rango y tipos incorrectos', () => {
    const box = createBox()
    assert.throws(
      () => assertValidGeometry({ ...box, indices: Uint16Array.from([0, 1, 99]) }),
      /fuera de rango/,
    )
    assert.throws(() => assertValidGeometry({ ...box, indices: [0, 1, 2] }), /Uint16Array o Uint32Array/)
    assert.throws(() => assertValidGeometry({ ...box, uvs: new Float32Array(3) }), /uvs/)
  })
})
