import {Dict} from "../src/Helpers/Dict";

describe('Dict', () => {
    it('should set and get values correctly', () => {
        const dict = new Dict<string, number>(key => key);
        dict.set('a', 1);
        expect(dict.get('a')).toBe(1);
    });
});
