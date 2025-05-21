import {
    ColumnDefinition,
    View,
    Views,
    Columns,
    ViewOptions,
    TableData,
    SortOptions,
    FilterOptions,
    ComparisonClause,
    LogicalClause,
} from './types';
import { crc } from './shared-general';
import { normalizeOperator } from './shared-data';

export abstract class TableBase {
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

    createView(options: ViewOptions = { name: 'view1' }): string | number {
        let _viewName = options.name || 'view1';
        let _view = this.getView(_viewName);
        if (_view === null) {
            _viewName = '';
            // Check options has all attributes for Filter
            if (options.query) {
                _viewName = this.filterData(options as FilterOptions);
            } else if (options.sortColumns) {
                _viewName = this.sortData(options as SortOptions);
            }
            if (_viewName != '') {
                _view = this.getView(_viewName);
                if (_view) {
                    _view.type = 'view';
                }
            }
        }
        return _viewName;
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

    protected sortData(options: SortOptions = { sortColumns: [], setActive: true }): string | number {
        const _sortColumns = this.getSortColumns(options.sortColumns || []);
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

    protected filterData(
        options: FilterOptions = {
            name: 'filter1',
            query: { attribute: '', value: '', operator: 'eq' } as ComparisonClause,
            setActive: true,
            baseView: 'default',
        }
    ): string | number {
        const _clause = JSON.parse(JSON.stringify(options.query));
        this.updateClause(_clause);
        const _pid = crc(JSON.stringify(_clause));
        const _filterViewName = options.name || _pid;
        const _filterView = this.getView(_filterViewName);
        if (_filterView === null) {
            const _baseViewName = options.baseView || this._activeViewName || 'default';
            const _baseView = this.getView(_baseViewName);
            const _doPreSort: boolean = ('_preSort' in _clause && Array.isArray(_clause._preSort)) || false;
            let _baseRowIds: number[] = _baseView?.rows || [];
            if (_doPreSort) {
                _baseRowIds = this.sortRows(_clause._preSort, _baseViewName);
            }
            const _filterRowIds: number[] = [];
            _baseRowIds.forEach((rowId) => {
                if (this.evaluateClause(this._data[rowId], _clause)) {
                    _filterRowIds.push(rowId);
                }
            });

            this._views[_filterViewName] = {
                pid: _pid,
                type: 'filter',
                baseView: _baseViewName,
                clause: JSON.stringify(_clause),
                rows: _filterRowIds.sort(),
            };
            this._views._ids[_pid] = _filterViewName;
            if (options.sortColumns) {
                const _sortColumns = this.getSortColumns(options.sortColumns);
                this._views[_filterViewName].rows = this.sortRows(_sortColumns, _filterViewName);
            }
        }
        if (options.setActive) {
            this._activeViewName = _filterViewName;
        }
        return _filterViewName;
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

    private getSortColumns(
        columns: (string | { [columnName: string]: 1 | -1 })[] | string | number
    ): ColumnDefinition[] {
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
        } else if (
            typeof columns === 'object' &&
            columns !== null &&
            !Array.isArray(columns) &&
            Object.prototype.toString.call(columns) === '[object Object]'
        ) {
            for (const columnName in columns as Record<string, any>) {
                if (Object.prototype.hasOwnProperty.call(columns, columnName)) {
                    const dir = (columns as Record<string, any>)[columnName];
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

    private updateClause(clause: LogicalClause | ComparisonClause) {
        const sortColumns: ColumnDefinition[] = [];
        const addSortColumns = (column: ColumnDefinition): void => {
            if (!sortColumns.some((col) => col.id === column.id)) {
                sortColumns.push(column);
            }
        };
        const traverse = (current: ComparisonClause | LogicalClause): void => {
            if ('attribute' in current && typeof current.attribute === 'string') {
                const _col = this.getColumn(current.attribute);
                if (_col) {
                    current.attribute = _col.id;
                    addSortColumns({ id: _col.id, dir: 1 });
                }
            } else if ('clauses' in current && Array.isArray(current.clauses)) {
                for (const subClause of current.clauses) {
                    traverse(subClause);
                }
            }
        };
        traverse(clause);
        clause._preSort = JSON.parse(JSON.stringify(sortColumns));
    }

    private evaluateComparison(item: any, clause: ComparisonClause): boolean {
        const attrValue = item[clause.attribute];
        const operator = normalizeOperator(clause.operator);
        const value = clause.value;

        switch (operator) {
            case 'eq':
                return attrValue === value;
            case 'neq':
                return attrValue !== value;
            case 'gt':
                return attrValue > value;
            case 'gte':
                return attrValue >= value;
            case 'lt':
                return attrValue < value;
            case 'lte':
                return attrValue <= value;
            case 'like':
                return typeof attrValue === 'string' && typeof value === 'string' && attrValue.includes(value);
            case 'notLike':
                return typeof attrValue === 'string' && typeof value === 'string' && !attrValue.includes(value);
            case 'in':
                return Array.isArray(value) && value.includes(attrValue);
            case 'notIn':
                return Array.isArray(value) && !value.includes(attrValue);
            case 'between':
                return Array.isArray(value) && value.length === 2 && attrValue >= value[0] && attrValue <= value[1];
            case 'notBetween':
                return Array.isArray(value) && value.length === 2 && (attrValue < value[0] || attrValue > value[1]);
            case 'isNull':
                return attrValue === null || attrValue === undefined;
            case 'isNotNull':
                return attrValue !== null && attrValue !== undefined;
            default:
                return false;
        }
    }

    private evaluateClause(item: any, clause: LogicalClause | ComparisonClause): boolean {
        if ('attribute' in clause) {
            return this.evaluateComparison(item, clause);
        } else {
            const { type, clauses } = clause;
            switch (type) {
                case 'and':
                    return clauses.every((sub) => this.evaluateClause(item, sub));
                case 'or':
                    return clauses.some((sub) => this.evaluateClause(item, sub));
                case 'not':
                    return !clauses.some((sub) => this.evaluateClause(item, sub));
            }
        }
    }
}
