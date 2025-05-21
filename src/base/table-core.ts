//src/base/table-core.ts
import { readJSON } from './shared-file';
import { TableBase } from './table-base';
import { TableOptions, ViewOptions, ColumnDefinition, SortOptions, FilterOptions, ComparisonClause } from './types';

export class TableCore extends TableBase {
    constructor() {
        super();
    }

    async initialize(options: TableOptions = {}): Promise<void> {
        this.clear();
        if (options.name) {
            this._name = options.name || 'table1';
        }
        if (options.fileName) {
            const data = await readJSON(options.fileName);
            this.parseData(data);
            //console.log('data length:', data.length, 'views:', this._views['default'].rows);
        } else if (options.rawData) {
            this.parseData(options.rawData);
        }
    }

    columns(options: ViewOptions = { name: 'default' }): ColumnDefinition[] {
        const _view = this.getView(options.name || 'default');
        return this.getColumns(_view, options.columns);
    }

    rows(options: ViewOptions = { name: 'default', includeRowId: false, useAlias: false }): { [key: string]: any }[] {
        return this.getRows(options);
    }

    sort(options: SortOptions = { sortColumns: [], setActive: true }): string | number {
        return this.sortData(options);
    }

    filter(
        options: FilterOptions = {
            query: { attribute: '', value: '', operator: 'eq' } as ComparisonClause,
            setActive: true,
        }
    ): string | number {
        return this.filterData(options);
    }
}
