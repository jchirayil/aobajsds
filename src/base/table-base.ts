import { ColumnDefinition, View, Views, Columns, ViewOptions, TableData, SortOptions } from './types';
import { crc } from './utils';

export class TableBase {
    protected _name: string = 'table1';
    protected _data: TableData;
    protected _cols: Columns;
    protected _activeViewName: string | number = 'default';
    protected _views: Views = { _ids: {} };

    protected constructor() {
        this._data = {};
        this._cols = { _ids: {} };
        this._views = { _ids: {} };
        this._activeViewName = 'default';
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
        this._activeViewName = 'default';
    }

    get view(): string | number {
        return this._activeViewName;
    }

    set view(viewName: string | number) {
        if (this._views._ids.hasOwnProperty(viewName)) {
            this._activeViewName = viewName;
        } else {
            throw new Error(`View ${viewName} does not exist.`);
        }
    }

    views(): Views {
        return { ...this._views };
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
            this._activeViewName = 'default';
        } else {
            console.log('Invalid data format. Expected an array of objects: ', data);
        }
    }

    private parseColumn(column: string | number): number {
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

    private parseRow(row: { [key: string]: any }): { [key: number]: any } {
        const _row: { [key: number]: any } = {};
        for (const [col, val] of Object.entries(row)) {
            _row[this.parseColumn(col)] = val;
        }
        return _row;
    }

    protected getRowIds(view: View | null): number[] {
        if (view && view.hasOwnProperty('rows')) {
            return view.rows;
        } else {
            return Object.keys(this._data).map(Number); // Convert keys to numbers
        }
    }

    protected getRows(
        options: ViewOptions = {
            name: 'default',
            includeRowId: false,
            useAlias: false,
        }
    ): { [key: string]: any }[] {
        const _view = this.getView(options.name || 'default');
        const _rIds = this.getRowIds(_view);
        const _cols = this.getColumns(_view, options.columns);
        const _rows: { [key: string]: any }[] = [];

        for (const key of _rIds) {
            _rows.push(this.getRow(Number(key), _cols, options));
        }
        return _rows;
    }

    protected getRow(
        id: number,
        columns: ColumnDefinition[],
        options: { includeRowId?: boolean; useAlias?: boolean } = {}
    ): { [key: string]: any } {
        const row: { [key: string]: any } = options.includeRowId ? { _rowId: id } : {};
        columns.forEach((col) => {
            const key = options.useAlias && col.alias ? col.alias : String(col.id);
            row[key] = this._data[id]?.[col.id];
        });
        return row;
    }

    protected getColumns(
        view: View | null = null,
        columns: ColumnDefinition[] | string[] | string | number[] | number | null = null
    ): ColumnDefinition[] {
        if (this.isColumnArray(columns)) {
            return columns;
        }
        const _cols: ColumnDefinition[] = [];
        if (columns) {
            if (Array.isArray(columns)) {
                columns.forEach((col) => {
                    const column = this.getColumn(col);
                    if (column) {
                        _cols.push(column);
                    }
                });
            } else if (typeof columns === 'string' || typeof columns === 'number') {
                const column = this.getColumn(columns);
                if (column) {
                    _cols.push(column);
                }
            }
        } else if (view && view.hasOwnProperty('cols')) {
            view.cols?.forEach((col) => {
                const column = this.getColumn(col);
                if (column) {
                    _cols.push(column);
                }
            });
        } else {
            for (const col of Object.keys(this._cols)) {
                if (col !== '_ids') {
                    const column = this.getColumn(col);
                    if (column) {
                        _cols.push(column);
                    }
                }
            }
        }

        return _cols;
    }

    protected getColumn(name: string | number): ColumnDefinition | null {
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

    protected sortData(options: SortOptions = { columns: [], setActive: true }): string | number {
        const _sortColumns = this.getSortColumns(options.columns || []);
        const _pid = crc(JSON.stringify(_sortColumns));
        const _sortViewName = options.name || _pid;
        const _sortView = this.getView(_sortViewName);

        if (_sortView === null) {
            this._views[_sortViewName] = {
                pid: _pid,
                type: 'sort',
                baseView: options.baseView || this._activeViewName || 'default',
                clause: JSON.stringify(_sortColumns),
                rows: this.sortRows(_sortColumns, options.baseView || this._activeViewName || 'default'),
            };
            this._views._ids[_pid] = _sortViewName;
        }
        if (options.setActive) {
            this._activeViewName = _sortViewName;
        }
        return _sortViewName;
    }

    private sortRows(sortColumns: ColumnDefinition[], baseViewName: string | number = 'default'): number[] {
        const _rows = this.getRows({ name: baseViewName, columns: sortColumns, includeRowId: true });
        const _sortedRows: number[] = [];
        if (_rows.length > 0) {
            _rows.sort((a, b) => {
                for (const col of sortColumns) {
                    const comparison = this.compareValues(a[col.id], b[col.id], col.dir ?? 1);
                    if (comparison !== 0) {
                        return comparison;
                    }
                }
                return 0;
            });
            _rows.forEach((row) => {
                _sortedRows.push(row._rowId);
            });
        }
        return _sortedRows;
    }

    protected getView(nameOrId: string | number): View | null {
        let _view = null;
        if (this.views.hasOwnProperty(nameOrId) || this._views.hasOwnProperty(String(nameOrId))) {
            _view = this._views[nameOrId];
        } else if (typeof nameOrId === 'number' && this._views._ids.hasOwnProperty(String(nameOrId))) {
            _view = this._views[this._views._ids[String(nameOrId)]];
        } else if (typeof nameOrId === 'string' && this._views._ids.hasOwnProperty(nameOrId)) {
            _view = this._views[this._views._ids[nameOrId]];
        }
        if (this.isView(_view)) {
            return _view;
        }
        return null;
    }

    private isColumnDefinition(value: any): value is ColumnDefinition {
        return value && typeof value.id === 'number';
    }

    private isColumnArray(value: any): value is Array<ColumnDefinition> {
        return Array.isArray(value) && value.every((col) => this.isColumnDefinition(col));
    }

    private isView(value: any): value is View {
        return (
            value &&
            ((typeof value.pid === 'string' && typeof value.type === 'string') ||
                (typeof value.pid === 'number' && typeof value.type === 'string'))
        );
    }

    private getSortColumns(columns: string[] | { [columnName: string]: 1 | -1 } | string | number): ColumnDefinition[] {
        const sortCols: ColumnDefinition[] = [];
        const processColumn = (col: string | number, dir: 1 | -1 = 1) => {
            const def = this.getColumn(col);
            if (def) {
                sortCols.push({ id: def.id, alias: def.alias, dir });
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

    private compareValues(value1: any, value2: any, direction: 1 | -1): number {
        const dir = direction > -1 ? 1 : -1;
        const v1 = value1 === undefined || value1 === null ? '' : value1;
        const v2 = value2 === undefined || value2 === null ? '' : value2;
        return (v1 < v2 ? -1 : v1 > v2 ? 1 : 0) * dir;
    }
}
