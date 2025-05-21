import { expect } from "chai";
import { TableCore } from "../../src/base/table-core";

describe("TableCore Performance", () => {
    let tbl: TableCore;
    const LARGE_SIZE = 500_000;
    const EXPECTED_TIME = 2000; // 2 seconds
    const largeData = Array.from({ length: LARGE_SIZE }, (_, i) => ({
        id: i,
        value: Math.floor(Math.random() * 100000),
        group: i % 10,
    }));

    beforeEach(() => {
        tbl = new TableCore();
    });

    it("should initialize with large dataset quickly", async function () {
        this.timeout(5000);
        const start = Date.now();
        await tbl.initialize({ rawData: largeData });
        const elapsed = Date.now() - start;
        expect(tbl.rows().length).to.equal(LARGE_SIZE);
        console.log(`\tInitialization time: ${elapsed}ms`);
        expect(elapsed).to.be.lessThan(EXPECTED_TIME);
    });

    it("should sort large dataset quickly", async function () {
        this.timeout(5000);
        await tbl.initialize({ rawData: largeData });
        const start = Date.now();
        const sortView = tbl.sort({ sortColumns: [{ value: 1 }] });
        const elapsed = Date.now() - start;
        const rows = tbl.rows({ name: sortView, useAlias: true });
        expect(Number(rows[0].value)).to.be.at.most(Number(rows[1].value));
        console.log(`\tSort time: ${elapsed}ms`);
        expect(elapsed).to.be.lessThan(EXPECTED_TIME);
    });

    it("should filter large dataset quickly", async function () {
        this.timeout(5000);
        await tbl.initialize({ rawData: largeData });
        const start = Date.now();
        const filterView = tbl.filter({
            query: { attribute: "group", value: 5, operator: "eq" }
        });
        const elapsed = Date.now() - start;
        const rows = tbl.rows({ name: filterView, useAlias: true});
        expect(rows.every(r => r.group === 5)).to.be.true;
        console.log(`\tFilter time: ${elapsed}ms`);
        expect(elapsed).to.be.lessThan(EXPECTED_TIME);
    });
});