import {Vec2, vec2Equals} from "../Helpers/VecMath";
import {PriorityQueue} from "../Helpers/PriorityQueue";
import {Vector2Dict} from "../Helpers/Dict";

export type AStarGrid = {
    getNeighbors: (v: Vec2, exceptions?: Vec2[]) => Vec2[]
}

export type AStarNode = {
    index: Vec2
    estimatedDistanceFromStart: number
}

export class AStarFinder {
    _priorityQueue: PriorityQueue<AStarNode>


    constructor() {
        this._priorityQueue = new PriorityQueue((a, b) => {
            return a?.estimatedDistanceFromStart > b?.estimatedDistanceFromStart
        });
    }

    findPath(grid: AStarGrid, from: Vec2, to: Vec2, includeStart: boolean = false): Vec2[] {
        if (grid === undefined || grid == null) {
            return [];
        }

        if (from == null || to == null) {
            return [];
        }

        let pathExists: boolean = false;

        this._priorityQueue.clear();
        let visitedIndices = new Vector2Dict<boolean>()
        let distancesFromStart = new Vector2Dict<number>()
        let previousIndexMap = new Vector2Dict<Vec2>()

        this._priorityQueue.push({index: from, estimatedDistanceFromStart: 0});
        distancesFromStart.set(from, 0)

        let currentIndex: Vec2
        let currentNode: AStarNode;
        let neighborIndexOfCurrentNode: Vec2;
        let neighborNode: AStarNode;
        let distance: number;

        while (this._priorityQueue.size() > 0) {
            currentNode = this._priorityQueue.pop()!;
            currentIndex = currentNode.index

            if (visitedIndices.has(currentIndex)) {
                continue;
            }

            visitedIndices.set(currentIndex, true);

            if (vec2Equals(currentIndex, to)) {
                pathExists = true;
                break;
            }

            let neighbors = grid.getNeighbors(currentIndex, [to])

            while (neighbors.length > 0) {
                // node the arc is pointing to
                neighborIndexOfCurrentNode = neighbors.pop()!;

                // skip already marked nodes
                if (visitedIndices.get(neighborIndexOfCurrentNode)) {
                    continue;
                }

                distance = distancesFromStart.get(currentIndex)! + 1;


                if (previousIndexMap.get(neighborIndexOfCurrentNode)) {
                    if (distance < distancesFromStart.get(neighborIndexOfCurrentNode)!) {
                        previousIndexMap.set(neighborIndexOfCurrentNode, currentIndex);
                        distancesFromStart.set(neighborIndexOfCurrentNode, distance);
                    } else {
                        continue;
                    }
                } else {
                    previousIndexMap.set(neighborIndexOfCurrentNode, currentIndex);
                    distancesFromStart.set(neighborIndexOfCurrentNode, distance);
                }

                neighborNode = {
                    index: neighborIndexOfCurrentNode,
                    estimatedDistanceFromStart: this.estimateDistance(neighborIndexOfCurrentNode, to) + distance
                };

                if (!this._priorityQueue.contains(neighborNode, x => vec2Equals(x.index, neighborNode.index))) {
                    this._priorityQueue.push(neighborNode);
                }
            }
        }

        const path: Array<Vec2> = new Array<Vec2>();
        if (pathExists) {
            let nodeTraversal = to;
            while (!vec2Equals(nodeTraversal, from)) {
                path.push(nodeTraversal);
                nodeTraversal = previousIndexMap.get(nodeTraversal)!;
            }

            if (includeStart) {
                path.push(from);
            }

            path.reverse();
        }

        return path;
    }

    private estimateDistance(from: Vec2, to: Vec2) {
        return Math.abs(to.x - from.x) + Math.abs(to.y - from.y)
    }
}