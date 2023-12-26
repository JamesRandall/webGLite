import {StarSystem} from "./starSystem";

export interface Size {
    width: number
    height: number
}

export interface Point { x: number, y: number}

export interface Rect {
    left: number,
    top: number,
    width: number,
    height: number
}

export function isPointInRect(pt:Point, rect: Rect) {
    return pt.x >= rect.left && pt.x < (rect.left + rect.width) && pt.y >= rect.top && pt.y < (rect.top + rect.height);
}

export function distance(p1: Point, p2: Point) {
    const xDelta = p2.x - p1.x
    const yDelta = p2.y - p1.y
    return Math.sqrt(xDelta*xDelta + yDelta*yDelta)
}