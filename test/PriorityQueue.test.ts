import { PriorityQueue } from "../src/Helpers/PriorityQueue";

describe('PriorityQueue', () => {
    it('should push and pop values correctly', () => {
        const pq = new PriorityQueue<number>();
        pq.push(1);
        pq.push(2);
        pq.push(-1)
        expect(pq.pop()).toBe(2);
    });

    // Add more tests for other methods
});