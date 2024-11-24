import {Vec2, vec2Equals} from "./VecMath";

export class Dict<K, V> {
    private map = new Map<string, [K, V]>();

    constructor(public toIdString: (k: K) => string, entries?: Iterable<[K, V]>) {
        if (entries) {
            for (const [k, v] of entries) {
                this.set(k, v);
            }
        }
    }

    set(k: K, v: V): this {
        this.map.set(this.toIdString(k), [k, v]);
        return this;
    }

    get(k: K): V | undefined {
        return this.map.get(this.toIdString(k))?.[1];
    }

    has(k: K): boolean {
        return this.map.has(this.toIdString(k));
    }

    deleteAllWithValue(v: V): void {
        for (const [key, val] of this.map.values()) {
            if (val === v) {
                this.map.delete(this.toIdString(key));
            }
        }
    }

    delete(k: K): void {
        this.map.delete(this.toIdString(k));
    }

    [Symbol.iterator](): Iterator<[K, V]> {
        return this.map.values();
    }

    getEntriesWith(lambda?: (k: K, v: V) => boolean): Array<[K, V]> {
        const entries: [K, V][] = [];
        for (const [key, value] of this.map.values()) {
            if (!lambda || lambda(key, value)) {
                entries.push([key, value]);
            }
        }
        return entries;
    }

    values(): Array<V> {
        const entries: V[] = [];
        for (const [, value] of this.map.values()) {
            entries.push(value);
        }
        return entries;
    }

    keys(): Array<K> {
        const entries: K[] = [];
        for (const [key] of this.map.values()) {
            entries.push(key);
        }
        return entries;
    }

    copy(): Dict<K, V> {
        return new Dict<K, V>(this.toIdString, this);
    }
}

export class Vector2Dict<V> extends Dict<Vec2, V> {
    constructor(entries?: Iterable<[Vec2, V]>) {
        super(v => `${v.x},${v.y}`, entries);
    }
}

export class Vector2PairDict<V> extends Dict<[Vec2, Vec2], V> {
    constructor(entries?: Iterable<[[Vec2, Vec2], V]>) {
        super(([v, w]) => {
            let [min, max] = (v.x === w.x)
                ? (v.y < w.y ? [v, w] : [w, v])
                : (v.x < w.x ? [v, w] : [w, v]);
            return `${min.x},${min.y},${max.x},${max.y}`;
        }, entries);
    }

    hasAnyWithKey(index: Vec2) {
        return this.getEntriesWith(([v, w]) => vec2Equals(v, index) || vec2Equals(w, index)).length > 0;
    }
}