/**
 * Utilidades matemáticas ligeras (Float32Array) para cámaras, jerarquías de nodos
 * y animación esquelética glTF 2.0 en WebGL2 sin dependencias externas.
 */

export function mat4Create() {
  const out = new Float32Array(16)
  out[0] = 1
  out[5] = 1
  out[10] = 1
  out[15] = 1
  return out
}

export function mat4Identity(out) {
  out.fill(0)
  out[0] = 1
  out[5] = 1
  out[10] = 1
  out[15] = 1
  return out
}

export function mat4Copy(out, a) {
  out.set(a)
  return out
}

export function mat4Multiply(out, a, b) {
  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3]
  const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7]
  const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11]
  const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15]

  let b0, b1, b2, b3
  b0 = b[0]; b1 = b[1]; b2 = b[2]; b3 = b[3]
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

  b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7]
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

  b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11]
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

  b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15]
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33
  return out
}

export function mat4Perspective(out, fovYRad, aspect, near, far) {
  const f = 1.0 / Math.tan(fovYRad * 0.5)
  const nf = 1.0 / (near - far)
  out.fill(0)
  out[0] = f / aspect
  out[5] = f
  out[10] = (far + near) * nf
  out[11] = -1
  out[14] = 2 * far * near * nf
  return out
}

export function mat4LookAt(out, eye, center, up) {
  let zx = eye[0] - center[0]
  let zy = eye[1] - center[1]
  let zz = eye[2] - center[2]
  let len = Math.hypot(zx, zy, zz)
  if (len < 1e-6) return mat4Identity(out)
  zx /= len; zy /= len; zz /= len

  let xx = up[1] * zz - up[2] * zy
  let xy = up[2] * zx - up[0] * zz
  let xz = up[0] * zy - up[1] * zx
  len = Math.hypot(xx, xy, xz)
  if (len < 1e-6) {
    xx = 0; xy = 0; xz = 0
  } else {
    xx /= len; xy /= len; xz /= len
  }

  let yx = zy * xz - zz * xy
  let yy = zz * xx - zx * xz
  let yz = zx * xy - zy * xx
  len = Math.hypot(yx, yy, yz)
  if (len > 1e-6) {
    yx /= len; yy /= len; yz /= len
  }

  out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0
  out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0
  out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0
  out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2])
  out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2])
  out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2])
  out[15] = 1
  return out
}

export function mat4FromTRS(out, t, q, s) {
  const x = q[0], y = q[1], z = q[2], w = q[3]
  const x2 = x + x, y2 = y + y, z2 = z + z
  const xx = x * x2, xy = x * y2, xz = x * z2
  const yy = y * y2, yz = y * z2, zz = z * z2
  const wx = w * x2, wy = w * y2, wz = z2 * w
  const sx = s[0], sy = s[1], sz = s[2]

  out[0] = (1 - (yy + zz)) * sx
  out[1] = (xy + wz) * sx
  out[2] = (xz - wy) * sx
  out[3] = 0
  out[4] = (xy - wz) * sy
  out[5] = (1 - (xx + zz)) * sy
  out[6] = (yz + wx) * sy
  out[7] = 0
  out[8] = (xz + wy) * sz
  out[9] = (yz - wx) * sz
  out[10] = (1 - (xx + yy)) * sz
  out[11] = 0
  out[12] = t[0]
  out[13] = t[1]
  out[14] = t[2]
  out[15] = 1
  return out
}

export function quatMultiply(out, a, b) {
  const ax = a[0], ay = a[1], az = a[2], aw = a[3]
  const bx = b[0], by = b[1], bz = b[2], bw = b[3]
  out[0] = aw * bx + ax * bw + ay * bz - az * by
  out[1] = aw * by - ax * bz + ay * bw + az * bx
  out[2] = aw * bz + ax * by - ay * bx + az * bw
  out[3] = aw * bw - ax * bx - ay * by - az * bz
  return out
}

export function quatFromEulerXYZ(out, rx, ry, rz) {
  const cx = Math.cos(rx * 0.5), sx = Math.sin(rx * 0.5)
  const cy = Math.cos(ry * 0.5), sy = Math.sin(ry * 0.5)
  const cz = Math.cos(rz * 0.5), sz = Math.sin(rz * 0.5)
  out[0] = sx * cy * cz + cx * sy * sz
  out[1] = cx * sy * cz - sx * cy * sz
  out[2] = cx * cy * sz + sx * sy * cz
  out[3] = cx * cy * cz - sx * sy * sz
  return out
}

/** Normaliza un cuaternión (evita matrices sesgadas si el llamador pasa uno aproximado). */
export function quatNormalize(out, q) {
  const len = Math.hypot(q[0], q[1], q[2], q[3])
  if (len < 1e-12) {
    out[0] = 0
    out[1] = 0
    out[2] = 0
    out[3] = 1
    return out
  }
  const inv = 1 / len
  out[0] = q[0] * inv
  out[1] = q[1] * inv
  out[2] = q[2] * inv
  out[3] = q[3] * inv
  return out
}

/** Transforma un punto (w = 1) por una matriz 4×4 afín en orden de columnas. */
export function mat4TransformPoint(out, m, p) {
  const x = p[0], y = p[1], z = p[2]
  out[0] = m[0] * x + m[4] * y + m[8] * z + m[12]
  out[1] = m[1] * x + m[5] * y + m[9] * z + m[13]
  out[2] = m[2] * x + m[6] * y + m[10] * z + m[14]
  return out
}

/**
 * Matriz de normales (3×3 en orden de columnas) = inversa traspuesta de la parte lineal de `m`.
 * Con escala no uniforme `mat3(m)` deformaría las normales; aquí se usa la matriz de cofactores
 * dividida por el determinante, que no requiere invertir. Devuelve null si la matriz es singular.
 */
export function mat3NormalFromMat4(out, m) {
  const c0x = m[5] * m[10] - m[6] * m[9]
  const c0y = m[6] * m[8] - m[4] * m[10]
  const c0z = m[4] * m[9] - m[5] * m[8]
  const det = m[0] * c0x + m[1] * c0y + m[2] * c0z
  if (Math.abs(det) < 1e-18) return null
  const inv = 1 / det
  out[0] = c0x * inv
  out[1] = c0y * inv
  out[2] = c0z * inv
  out[3] = (m[9] * m[2] - m[10] * m[1]) * inv
  out[4] = (m[10] * m[0] - m[8] * m[2]) * inv
  out[5] = (m[8] * m[1] - m[9] * m[0]) * inv
  out[6] = (m[1] * m[6] - m[2] * m[5]) * inv
  out[7] = (m[2] * m[4] - m[0] * m[6]) * inv
  out[8] = (m[0] * m[5] - m[1] * m[4]) * inv
  return out
}

/** Determinante de la parte lineal 3×3 de una matriz 4×4 (negativo ⇒ la transformación refleja). */
export function mat4Determinant3(m) {
  return (
    m[0] * (m[5] * m[10] - m[6] * m[9]) +
    m[1] * (m[6] * m[8] - m[4] * m[10]) +
    m[2] * (m[4] * m[9] - m[5] * m[8])
  )
}

export function vec3Sub(out, a, b) {
  out[0] = a[0] - b[0]
  out[1] = a[1] - b[1]
  out[2] = a[2] - b[2]
  return out
}

export function vec3Dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function vec3Cross(out, a, b) {
  const x = a[1] * b[2] - a[2] * b[1]
  const y = a[2] * b[0] - a[0] * b[2]
  const z = a[0] * b[1] - a[1] * b[0]
  out[0] = x
  out[1] = y
  out[2] = z
  return out
}

/** Normaliza; un vector casi nulo queda en cero (en vez de producir NaN). */
export function vec3Normalize(out, a) {
  const len = Math.hypot(a[0], a[1], a[2])
  if (len < 1e-12) {
    out[0] = 0
    out[1] = 0
    out[2] = 0
    return out
  }
  const inv = 1 / len
  out[0] = a[0] * inv
  out[1] = a[1] * inv
  out[2] = a[2] * inv
  return out
}
