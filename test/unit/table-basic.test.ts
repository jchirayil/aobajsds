// test/base/table-basic.test.ts
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
            await tbl2.initialize({ name: 'table2' })
        })();
        expect(tbl2.name).to.equal('table2');
    });
    it('should set name from options', () => {
        tbl.name = 'table3';
        expect(tbl.name).to.equal('table3');
    });
    it('should set name and data - intialize method - default view', () => {

        (async () => {
            const tbl2 = new TableCore();
            await tbl2.initialize({
                name: 'table1', rawData: [
                    { id: 1, name: 'John Smith', organization: 'Acme Inc' },
                    { id: 2, name: 'Mary Jane', organization: 'Acme Inc' },
                    { id: 3, name: 'Ruth Mayers', organization: 'Acme Inc' }
                ]
            });
            const _rows = tbl2.rows();
            expect(tbl2.name).to.equal('table1');
            expect(tbl2.view).to.equal('default');
            expect(_rows.length).to.equal(3);
        })();

    });
    it('should set name and json file - intialize method', () => {
        const filePath = path.join(__dirname, '../data/car-road-tests.json');
        (async () => {
            const tbl2 = new TableCore();
            await tbl2.initialize({
                name: 'table1', fileName: filePath
            });
            expect(tbl2.columns().length).to.equal(12);
        })();
    });
    it('should set name and compressed json file (.gz) - initialize method', () => {
        const filePath = path.join(__dirname, '../data/house-prices.json.gz');
        (async () => {
            const tbl2 = new TableCore();
            await tbl2.initialize({
                name: 'table1', fileName: filePath
            });
            expect(tbl2.columns().length).to.equal(13);
        })();

    });
    it('get rows - _rowId & column alias', () => {

        (async () => {
            const tbl2 = new TableCore();
            await tbl2.initialize({
                name: 'table1', rawData: [
                    { id: 1, name: 'John Smith', organization: 'Acme Inc' },
                    { id: 2, name: 'Mary Jane', organization: 'Acme Inc' },
                    { id: 3, name: 'Ruth Mayers', organization: 'Acme Inc' }
                ]
            });
            const _rows = tbl2.rows({ name: 'default', includeRowId: true, useAlias: true });
            expect(_rows.length).to.equal(3);
            expect(_rows[0].hasOwnProperty('_rowId')).to.equal(true);
            expect(_rows[0].hasOwnProperty('name')).to.equal(true);
        })();

    });
    it('get columns', () => {
        (async () => {
            const tbl2 = new TableCore();
            await tbl2.initialize({
                name: 'table1', rawData: [
                    { id: 1, name: 'John Smith', organization: 'Acme Inc' },
                    { id: 2, name: 'Mary Jane', organization: 'Acme Inc' },
                    { id: 3, name: 'Ruth Mayers', organization: 'Acme Inc' }
                ]
            });
            const _columns = tbl2.columns();
            expect(_columns.length).to.equal(3);
        })();
    }
    );
    it('get views', () => {
        (async () => {
            const tbl2 = new TableCore();
            await tbl2.initialize({
                name: 'table1', rawData: [
                    { id: 1, name: 'John Smith', organization: 'Acme Inc' },
                    { id: 2, name: 'Mary Jane', organization: 'Acme Inc' },
                    { id: 3, name: 'Ruth Mayers', organization: 'Acme Inc' }
                ]
            });
            const _views = tbl2.views();
            expect(_views.length).to.equal(1);
        })();
    }
    );
    it('sort rows', () => {
        (async () => {
            const tbl2 = new TableCore();
            await tbl2.initialize({
                name: 'table1', rawData: [
                    { id: 1, name: 'Zoe Smith', organization: 'Acme Inc' },
                    { id: 2, name: 'Yarn Jane', organization: 'Acme Inc' },
                    { id: 3, name: 'Ver Mayers', organization: 'Acme Inc' }
                ]
            });
            const _sort = tbl2.sort({ sortColumns: 'name' });
            expect(tbl2.views.length).to.equal(2);
        })();
    });
    it('filter rows - one condition', () => {
        (async () => {
            const tbl2 = new TableCore();
            await tbl2.initialize({
                name: 'table1', rawData: [
                    { id: 1, name: 'Zoe Smith', organization: 'Acme Inc' },
                    { id: 2, name: 'Yarn Jane', organization: 'Acme Inc' },
                    { id: 3, name: 'Ver Mayers', organization: 'Acme Inc' }
                ]
            });
            const _filter = tbl2.filter({
                name: 'filter1',
                query: { attribute: 'name', value: 'Yarn Jane', operator: 'eq' }
            });
            expect(tbl2.views.length).to.equal(2);
        })();
    });
    it('filter rows - condition array', () => {
        (async () => {
            const tbl2 = new TableCore();
            await tbl2.initialize({
                name: 'table1', rawData: [
                    { id: 1, name: 'Zoe Smith', organization: 'Acme Inc' },
                    { id: 2, name: 'Yarn Jane', organization: 'Acme Inc' },
                    { id: 3, name: 'Ver Mayers', organization: 'Acme Inc' },
                    { id: 4, name: 'Adam Motts', organization: 'Acme Plc' },
                    { id: 5, name: 'Beatty Brooks', organization: 'Acme Plc' },
                    { id: 6, name: 'Ver Mayers', organization: 'Acme Plc' }
                ]
            });
            const _filter = tbl2.filter({
                name: 'filter1',
                query: {
                    type: 'or',
                    clauses: [
                        { attribute: 'name', value: 'Ver Mayers', operator: 'eq' },
                        { attribute: 'name', value: 'Zoe Smith', operator: 'eq' }
                    ]
                }
            });
            expect(tbl2.views.length).to.equal(2);
        })();
    });
    it('filter rows - query array', () => {
        (async () => {
            const tbl2 = new TableCore();
            await tbl2.initialize({
                name: 'table1', rawData: [
                    { id: 1, name: 'Zoe Smith', organization: 'Acme Inc' },
                    { id: 2, name: 'Yarn Jane', organization: 'Acme Inc' },
                    { id: 3, name: 'Ver Mayers', organization: 'Acme Inc' },
                    { id: 4, name: 'Adam Motts', organization: 'Acme Plc' },
                    { id: 5, name: 'Beatty Brooks', organization: 'Acme Plc' },
                    { id: 6, name: 'Ver Mayers', organization: 'Acme Plc' }
                ]
            });
            const _filter = tbl2.filter({
                name: 'filter1',
                query: {
                    type: 'and',
                    clauses:
                        [
                            { attribute: 'id', value: 5, operator: 'lt' }
                            , {
                                type: 'or',
                                clauses:
                                    [{ attribute: 'name', value: 'Ver Mayers', operator: 'eq' },
                                    { attribute: 'organization', value: 'Acme Plc', operator: 'eq' }]
                            }]
                }
            });
            expect(tbl2.views.length).to.equal(2);
        })();
    });
});
