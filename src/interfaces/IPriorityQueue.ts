export interface IPriorityQueue<T> {
    push(value: T): void;
    top(): T | null;
    pop(): T | null;
    size(): number;
    empty(): boolean;
    toArray(): T[];
    clear(): void;
    contains(value: T, comparator?: (item: T) => boolean): boolean;
}