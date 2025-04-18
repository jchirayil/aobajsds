// test/base/dataset-simple.test.ts
import { expect } from 'chai';
import { Dataset } from '../../src/index';

describe('Dataset', () => {
    let ds: Dataset;
    beforeEach(() => {
        ds = new Dataset('a');
    });
    it('should have default name', () => {
        expect(ds.name).to.equal('a');
    });
    it('should set name from constructor', () => {
        const ds2 = new Dataset('b');
        expect(ds2.name).to.equal('b');
    });
});
