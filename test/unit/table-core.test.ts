import { expect } from "chai";
import { TableCore } from "../../src/base/table-core";
import * as path from "path";

describe("Table - Sort/Filter/View", () => {
    let tbl: TableCore;

    beforeEach(() => {
        tbl = new TableCore();
    });

    describe("with car-road-tests.json", () => {
        const carDataPath = path.join(__dirname, "../data/car-road-tests.json");

        beforeEach(async () => {
            await tbl.initialize({ fileName: carDataPath });
        });

        it("should load columns and rows", () => {
            const columns = tbl.columns();
            const rows = tbl.rows();
            expect(columns).to.be.an("array").and.not.empty;
            expect(rows).to.be.an("array").and.not.empty;
        });

        it("should sort by mpg ascending", () => {
            const _sortView = tbl.sort({ sortColumns: [{"mpg": 1 }] });
            const rows = tbl.rows({ name: _sortView, useAlias: true });
            expect(rows[0].mpg).to.be.at.most(rows[1].mpg);
        });

        it("should sort by mpg descending", () => {
            const _sortView = tbl.sort({ sortColumns: [{ "mpg":-1 }] });
            const rows = tbl.rows({name: _sortView, useAlias: true});
            expect(rows[0].mpg).to.be.at.least(rows[1].mpg);
        });

        it("should filter cars with mpg > 25", () => {
            const _filterView = tbl.filter({
                query: { attribute: "mpg", value: 25, operator: "gt" }
            });
            const rows = tbl.rows({name: _filterView, useAlias: true});
            expect(rows.every(r => r.mpg > 25)).to.be.true;
        });

        it("should support view options", () => {
            const columns = tbl.columns({ name: "default" });
            expect(columns.map(c => c.alias)).to.include.members(["mpg", "model"]);
        });
    });

    describe("with house-prices.json.gz", () => {
        const houseDataPath = path.join(__dirname, "../data/house-prices.json.gz");

        beforeEach(async () => {
            await tbl.initialize({ fileName: houseDataPath });
        });

        it("should load house price data", () => {
            const columns = tbl.columns();
            const rows = tbl.rows();
            expect(columns).to.be.an("array").and.not.empty;
            expect(rows).to.be.an("array").and.not.empty;
        });

        it("should sort by price ascending", () => {
            const sortView = tbl.sort({ sortColumns: [{ "price":1 }]});
            const rows = tbl.rows({name: sortView, useAlias: true});
            expect(Number(rows[0].price)).to.be.at.most(Number(rows[1].price));
        });

        it("should filter houses with bedrooms >= 4", () => {
            const filterView = tbl.filter({
                query: { attribute: "bedrooms", value: 4, operator: "gte" }
            });
            const rows = tbl.rows({name: filterView, useAlias: true });
            expect(rows.every(r => r.bedrooms >= 4)).to.be.true;
        });

        it("should support custom view columns", () => {
            const columns = tbl.columns({ name: 'default', columns: ["price", "bedrooms"] });
            expect(columns.map(c => c.alias)).to.include.members(["price", "bedrooms"]);
        });
    });
});
