//src/shared-data.ts
import { ComparisonOperator, ComparisonClause, LogicalClause } from './types';

export function normalizeOperator(operator: string): ComparisonOperator {
    switch (operator) {
        case '=':
            return 'eq';
        case '!=':
            return 'neq';
        case '>':
            return 'gt';
        case '>=':
            return 'gte';
        case '<':
            return 'lt';
        case '<=':
            return 'lte';
        default:
            return operator as ComparisonOperator;
    }
}

export function isValidClause(clause: any): boolean {
    if (typeof clause !== 'object' || !clause) {
        return false;
    }
    if ('attribute' in clause && 'operator' in clause) {
        return isValidComparisonClause(clause);
    }
    if ('type' in clause && 'clauses' in clause) {
        return isValidLogicalClause(clause);
    }
    return false;
}

function isValidComparisonClause(clause: any): boolean {
    const validOperators: Set<string> = new Set([
        'eq',
        '=',
        'neq',
        '!=',
        'gt',
        '>',
        'gte',
        '>=',
        'lt',
        '<',
        'lte',
        '<=',
        'like',
        'notLike',
        'in',
        'notIn',
        'between',
        'notBetween',
        'isNull',
        'isNotNull',
    ]);
    if (typeof clause.attribute !== 'string' && !clause.attribute.trime()) {
        return false;
    }
    if (!validOperators.has(clause.operator)) return false;

    const op = normalizeOperator(clause.operator);

    // These operators do NOT require a value
    const noValueNeeded = ['isNull', 'isNotNull'];

    // These require an array of length 2
    const needsTwoElementArray = ['between', 'notBetween'];

    if (!noValueNeeded.includes(op)) {
        if (!('value' in clause)) return false;

        if (op === 'in' || op === 'notIn') {
            if (!Array.isArray(clause.value)) return false;
        }

        if (needsTwoElementArray.includes(op)) {
            if (!Array.isArray(clause.value) || clause.value.length !== 2) return false;
        }
    }
    return true;
}

function isValidLogicalClause(clause: any): boolean {
    const validTypes: Set<string> = new Set(['and', 'or', 'not']);

    if (!validTypes.has(clause.type)) return false;
    if (!Array.isArray(clause.clauses) || clause.clauses.length === 0) return false;

    if (clause.type === 'not' && clause.clauses.length !== 1) return false;

    return clause.clauses.every(isValidClause);
}

function extractAttributesFromClause(clause: ComparisonClause | LogicalClause): (string | number)[] {
    const attributes: (string | number)[] = [];

    function traverse(current: ComparisonClause | LogicalClause): void {
        if ('attribute' in current && typeof current.attribute === 'string') {
            if (!attributes.includes(current.attribute)) {
                attributes.push(current.attribute);
            }
        } else if ('clauses' in current && Array.isArray(current.clauses)) {
            for (const subClause of current.clauses) {
                traverse(subClause);
            }
        }
    }
    traverse(clause);
    return attributes;
}
