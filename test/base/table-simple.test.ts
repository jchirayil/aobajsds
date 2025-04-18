// test/base/table-simple.test.ts
import { expect } from 'chai';
import path from 'path';
import { TableCore } from '../../src/base/table-core';

describe('Table', () => {
    let tbl: TableCore;
    beforeEach(() => {
        tbl = new TableCore();
    });

    it('should have default name', () => {
        expect(tbl.name).to.equal('table1');
    });
    it('should set name - intialize method', () => {
        const tbl2 = new TableCore();
        (async () => {
            await tbl2.intialize({ name: 'table2' })
        })();
        expect(tbl2.name).to.equal('table2');
    });
    it('should set name from options', () => {
        tbl.name = 'table3';
        expect(tbl.name).to.equal('table3');
    });
    it('should set name and data - intialize method', () => {
        
        (async () => {
            const tbl2 = new TableCore();
            await tbl2.intialize({
                name: 'table1', rawData: [
                    { id: 1, name: 'John Smith', organization: 'Acme Inc' },
                    { id: 2, name: 'Mary Jane', organization: 'Acme Inc' },
                    { id: 3, name: 'Ruth Mayers', organization: 'Acme Inc' }
                ]
            });
            expect(tbl2.name).to.equal('table1');
        })();
        
    });
    it('should set name and json file - intialize method', () => {
        const filePath = path.join(__dirname, '../data/region-23-08m-db.json');
        (async () => {
            const tbl2 = new TableCore();
            await tbl2.intialize({
                name: 'table1', fileName: filePath
            });
            expect(tbl2.columns.length).to.equal(4);
        })();
    });
    it('should set name and compressed json file (.gz) - initialize method', () => {
        const filePath = path.join(__dirname, '../data/region-23-08m-db.json.gz');
        (async () => {
            const tbl2 = new TableCore();
            await tbl2.intialize({
                name: 'table1', fileName: filePath
            });
            expect(tbl2.columns.length).to.equal(4);
        })();

    });
});
