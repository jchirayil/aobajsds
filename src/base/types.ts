export interface ColumnDefinition {
    id: number;
    alias?: string;
    dir?: 1 | -1;
}

export interface View {
    pid: string | number; // Changed to string for consistency with CRC
    type: 'default' | 'sort' | 'filter';
    baseView?: string | number;
    clause?: string;
    rows: number[];
    cols?: number[];
}

export interface Views {
    _ids: { [key: string]: string | number }; // Keyed by string (PID)
    [key: string]: View | { [key: string]: string | number };
}

export interface Columns {
    _ids: { [key: number]: string }; // Keyed by string (PID)
    [key: string]: ColumnDefinition | { [key: number]: string };
}

export interface TableData {
    [rowId: number]: { [colId: number]: any };
}

export interface TableOptions {
    name?: string;
    fileName?: string | undefined;
    rawData?: any;
}

export interface SortOptions {
    name?: string;
    columns: string[] | { [columnName: string]: 1 | -1 } | string | number;
    setActive?: boolean;
    baseView?: string | number;
}

export interface ViewOptions {
    name?: string | number;
    columns?: ColumnDefinition[] | string[] | string | number[] | number | null;
    includeRowId?: boolean;
    useAlias?: boolean;
}

export interface FilterOptions {
    name?: string;
    query: ComparisonClause | LogicalClause;
    sortColumns?: string[] | { [columnName: string]: 1 | -1 } | string | number;
    setActive?: boolean;
    baseView?: string | number;
}

export type ComparisonOperator =
    | 'eq'
    | '='
    | 'neq'
    | '!='
    | 'gt'
    | '>'
    | 'gte'
    | '>='
    | 'lt'
    | '<'
    | 'lte'
    | '<='
    | 'like' // LIKE
    | 'notLike' // NOT LIKE
    | 'in' // IN
    | 'notIn' // NOT IN
    | 'between' // BETWEEN
    | 'notBetween' // NOT BETWEEN
    | 'isNull' // IS NULL
    | 'isNotNull'; // IS NOT NULL;

export type LogicalOperator = 'and' | 'or' | 'not';

export interface ComparisonClause {
    attribute: string | number;
    operator: ComparisonOperator;
    value?: any;
    valueColumn?: string | string[] | number | number[] | null;
    _preSort?: ColumnDefinition[];
}

export interface LogicalClause {
    type: LogicalOperator;
    clauses: (ComparisonClause | LogicalClause)[];
    _preSort?: ColumnDefinition[];
}
