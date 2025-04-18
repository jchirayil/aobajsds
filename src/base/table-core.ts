//src/base/table-core.ts
import { readJSON } from './utils';

interface ColumnDefinition {
    id: number;
    alias?: string;
}

interface SortColumn {
    id: number;
    dir: 1 | -1;
}

interface View {
    pid: string | number; // Changed to string for consistency with CRC
    type: 'default' | 'sort' | 'filter';
    baseView?: string;
    clause?: string;
    rows: number[];
    cols?: number[];
}

interface Views {
    _ids: { [key: string]: string }; // Keyed by string (PID)
    [key: string]: View | { [key: string]: string };
}

interface Columns {
    _ids: { [key: number]: string }; // Keyed by string (PID)
    [key: string]: ColumnDefinition | { [key: number]: string };
}

interface TableData {
    [rowId: number]: { [colId: number]: any };
}

interface TableOptions {
    name?: string;
    fileName?: string | undefined;
    rawData?: any;
}

export class TableCore {
    private _name: string = 'table1';
    private _data: TableData;
    private _cols: Columns;
    private _view: string | number = 'default';
    private _views: Views = { _ids: {} };

    constructor() {
        this._data = {};
        this._cols = { _ids: {} };
        this._views = { _ids: {} };
        this._view = 'default';
    }

    async intialize(options: TableOptions = {}): Promise<void> {
        this._data = {};
        this._cols = { _ids: {} };
        this._views = { _ids: {} };
        this._view = 'default';
        if (options.name) {
            this._name = options.name;
        }
        if (options.fileName) {
            //console.log('Loading data from file: ', options.fileName);
            (async () => {
                if (options.fileName) {
                    const data = await readJSON(options.fileName);
                    //console.log('Loaded data length: ', data.length);
                    this.parseData(data);
                    //console.log('After parsing: ', this._data);
                }
            })();
        } else if (options.rawData) {
            this.parseData(options.rawData);
        }
    }

    get name(): string {
        return this._name;
    }

    set name(name: string) {
        this._name = name;
    }

    clear(): void {
        this._cols = { _ids: {} };
        this._data = {};
        this._views = { _ids: {} };
        this._view = 'default';
    }

    parseData(data: any[]): void {
        if (Array.isArray(data)) {
            // rows in array
            this.clear();
            let _count = -1;
            data.forEach((row, index) => {
                this._data[index] = this.parseRow(row);
                _count = index;
            });
            this._views.default = {
                pid: 0,
                type: 'default',
                rows: [...Array(_count + 1).keys()],
            };
            this._views._ids[0] = 'default';
            this._view = 'default';
        } else {
            console.log('Invalid data format. Expected an array of objects: ', data);
        }
    }

    column(name: string | number): ColumnDefinition | null {
        if (typeof name === 'string' && this._cols.hasOwnProperty(name)) {
            const col = this._cols[name];
            if (this.isColumnDefinition(col)) {
                return { id: col.id, alias: name };
            } else {
                throw new Error(`Invalid column definition for column: ${name}`);
            }
        } else if (typeof name === 'number' && this._cols._ids.hasOwnProperty(name)) {
            return { id: name, alias: this._cols._ids[name] };
        }
        return null;
    }

    columns(viewCols?: number[]): ColumnDefinition[] {
        const columns: ColumnDefinition[] = [];
        if (viewCols) {
            viewCols.forEach((colId) => {
                const def = this.column(colId);
                if (def) columns.push(def);
            });
        } else {
            for (const colName in this._cols) {
                if (colName !== '_ids') {
                    const def = this.column(colName);
                    if (def) columns.push(def);
                }
            }
        }
        return columns;
    }

    getSortColumns(columns: string[] | { [columnName: string]: 1 | -1 } | string | number): SortColumn[] {
        const sortCols: SortColumn[] = [];
        const processColumn = (col: string | number, dir: 1 | -1 = 1) => {
            const def = this.column(col);
            if (def) {
                sortCols.push({ id: def.id, dir });
            }
        };

        if (typeof columns === 'string' || typeof columns === 'number') {
            processColumn(columns);
        } else if (Array.isArray(columns)) {
            columns.forEach((col) => {
                if (typeof col === 'string' || typeof col === 'number') {
                    processColumn(col);
                } else if (typeof col === 'object') {
                    const key = Object.keys(col)[0];
                    const value = Object.values(col)[0];
                    if (typeof value === 'number' && (value === 1 || value === -1)) {
                        processColumn(key, value);
                    } else {
                        processColumn(key); // Default to ASC if direction is invalid
                    }
                }
            });
        } else if (typeof columns === 'object' && columns !== null) {
            for (const columnName in columns) {
                if (Object.prototype.hasOwnProperty.call(columns, columnName)) {
                    const dir = columns[columnName];
                    if (dir === 1 || dir === -1) {
                        processColumn(columnName, dir);
                    } else {
                        processColumn(columnName); // Default to ASC if direction is invalid
                    }
                }
            }
        }
        return sortCols;
    }

    row(id: number, columns: ColumnDefinition[], useAlias: boolean = false): { [key: string]: any } {
        const row: { [key: string]: any } = {};
        columns.forEach((col) => {
            const key = useAlias && col.alias ? col.alias : String(col.id);
            row[key] = this._data[id]?.[col.id];
        });
        return row;
    }

    rows(rowIds: number[], columns: ColumnDefinition[], useAlias: boolean = false): { [key: string]: any }[] {
        return rowIds.map((id) => this.row(id, columns, useAlias));
    }

    sortRows(rowIds: number[], sortColumns: SortColumn[]): number[] {
        const sortableRows = rowIds.map((id) => ({ _rowId: id, data: this._data[id] }));
        sortableRows.sort((a, b) => {
            for (const col of sortColumns) {
                const comparison = this.compareValues(a.data[col.id], b.data[col.id], col.dir);
                if (comparison !== 0) {
                    return comparison;
                }
            }
            return 0;
        });
        return sortableRows.map((row) => row._rowId);
    }

    views(): Views {
        return { ...this._views };
    }

    get view(): string | number {
        return this._view;
    }
    set view(view: string | number) {
        if (this._views._ids.hasOwnProperty(view)) {
            this._view = view;
        } else {
            throw new Error(`View ${view} does not exist.`);
        }
    }

    protected parseColumn(column: string | number): number {
        if (typeof column === 'string' && this._cols.hasOwnProperty(column)) {
            const col = this._cols[column];
            if (this.isColumnDefinition(col)) {
                return col.id;
            } else {
                throw new Error(`Invalid column definition for column: ${column}`);
            }
        } else if (typeof column === 'number' && this._cols._ids.hasOwnProperty(column)) {
            return column;
        } else {
            const newId = Object.keys(this._cols._ids).length;
            this._cols._ids[newId] = column as string;
            this._cols[column as string] = { id: newId };
            return newId;
        }
    }

    protected parseRow(row: { [key: string]: any }): { [key: number]: any } {
        const parsedRow: { [key: number]: any } = {};
        for (const [col, val] of Object.entries(row)) {
            parsedRow[this.parseColumn(col)] = val;
        }
        return parsedRow;
    }

    protected compareValues(value1: any, value2: any, direction: 1 | -1): number {
        const dir = direction > -1 ? 1 : -1;
        const v1 = value1 === undefined || value1 === null ? '' : value1;
        const v2 = value2 === undefined || value2 === null ? '' : value2;
        return (v1 < v2 ? -1 : v1 > v2 ? 1 : 0) * dir;
    }

    protected getViewByNameOrId(nameOrId: string | number): View | null {
        if (typeof nameOrId === 'string' && this.views.hasOwnProperty(nameOrId)) {
            const _view = this._views[nameOrId];
            if (this.isView(_view)) {
                return _view;
            } else {
                throw new Error(`Invalid view information: ${nameOrId}`);
            }
        } else if (typeof nameOrId === 'number' && this._views._ids.hasOwnProperty(String(nameOrId))) {
            const _view = this._views[this._views._ids[String(nameOrId)]];
            if (this.isView(_view)) {
                return _view;
            } else {
                throw new Error(`Invalid view information: ${nameOrId}`);
            }
        } else if (typeof nameOrId === 'string' && this._views._ids.hasOwnProperty(nameOrId)) {
            const _view = this._views[this._views._ids[nameOrId]];
            if (this.isView(_view)) {
                return _view;
            } else {
                throw new Error(`Invalid view information: ${nameOrId}`);
            }
        }
        return null;
    }

    protected isColumnDefinition(value: any): value is ColumnDefinition {
        return value && typeof value.id === 'number';
    }

    protected isView(value: any): value is View {
        return value && typeof value.pid === 'string' && typeof value.type === 'string';
    }
}
