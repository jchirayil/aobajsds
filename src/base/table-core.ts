//src/base/table-core.ts
import { readJSON } from './utils';
import { TableBase } from './table-base';
import { TableOptions, ViewOptions, ColumnDefinition, SortOptions } from './types';

export class TableCore extends TableBase {
    constructor() {
        super();
    }

    async intialize(options: TableOptions = {}): Promise<void> {
        this.clear();
        if (options.name) {
            this._name = options.name;
        }
        if (options.fileName) {
            (async () => {
                if (options.fileName) {
                    const data = await readJSON(options.fileName);
                    this.parseData(data);
                }
            })();
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

    sort(options: SortOptions = { columns: [], setActive: true }): string | number {
        return this.sortData(options);
    }
}
