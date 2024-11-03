export type Vec2 = { x: number, y: number }

export function vec2Equals(a: Vec2, b: Vec2, allowedOffset: number = 0.0001) {
    return Math.abs(a.x - b.x) < allowedOffset && Math.abs(a.y - b.y) < allowedOffset
}

export function vec2Mean(a: Vec2, b: Vec2) {
    return vec2ScalarMultiply(0.5, vec2Add(a, b))
}

export function vec2Copy(v: Vec2) {
    return {x: v.x, y: v.y}
}

export function vec2Add(a: Vec2, b: Vec2) {
    return {x: a.x + b.x, y: a.y + b.y}
}

export function vec2ScalarMultiply(s: number, v: Vec2) {
    return {x: s * v.x, y: s * v.y}
}

export function mod(x: number, n: number) {
    return ((x % n) + n) % n
}

