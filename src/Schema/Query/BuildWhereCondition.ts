import XanvType from "xanv/XanvType";
import { formatValue, isObject } from "../../utils";
import { WhereSubCondition } from "./types";

const BuildWhereCondition = (column: string, conditions: WhereSubCondition, alias: string, xanv: XanvType<any, any>): string => {
   const subConditions = Object.keys(conditions)
      .map((subKey) => {
         const subValue = (conditions as any)[subKey];

         if (subValue === null) return `${alias}.${column} IS NULL`;
         if (subValue === undefined) return `${alias}.${column} IS NOT NULL`;
         if (subValue === "") return `${alias}.${column} = ''`;
         if (subValue === false) return `${alias}.${column} = FALSE`;
         if (subValue === true) return `${alias}.${column} = TRUE`;
         if (isObject(subValue)) {
            throw new Error(`Invalid value ${subValue} for ${alias}.${column}`);
         }
         xanv.parse(subValue);
         switch (subKey) {
            case 'equals':
               return `${alias}.${column} = ${formatValue(subValue)}`;
            case 'not':
               return `${alias}.${column} != ${formatValue(subValue)}`;
            case 'lt':
               return `${alias}.${column} < ${formatValue(subValue)}`;
            case 'lte':
               return `${alias}.${column} <= ${formatValue(subValue)}`;
            case 'gt':
               return `${alias}.${column} > ${formatValue(subValue)}`;
            case 'gte':
               return `${alias}.${column} >= ${formatValue(subValue)}`;
            case 'in':
               return `${alias}.${column} IN (${formatValue(subValue)})`;
            case 'notIn':
               return `${alias}.${column} NOT IN (${formatValue(subValue)})`;
            case 'between':
               return `${alias}.${column} BETWEEN ${formatValue(subValue[0])} AND ${formatValue(subValue[1])}`;
            case 'notBetween':
               return `${alias}.${column} NOT BETWEEN ${formatValue(subValue[0])} AND ${formatValue(subValue[1])}`;
            case 'contains':
               return `${alias}.${column} LIKE '%${subValue}%'`;
            case 'notContains':
               return `${alias}.${column} NOT LIKE '%${subValue}%'`;
            case 'startsWith':
               return `${alias}.${column} LIKE '${subValue}%'`;
            case 'endsWith':
               return `${alias}.${column} LIKE '%${subValue}'`;
            case 'isNull':
               return `${alias}.${column} IS NULL`;
            case 'isNotNull':
               return `${alias}.${column} IS NOT NULL`;
            case 'isEmpty':
               return `${alias}.${column} = ''`;
            case 'isNotEmpty':
               return `${alias}.${column} != ''`;
            case 'isTrue':
               return `${alias}.${column} = TRUE`;
            case 'isFalse':
               return `${alias}.${column} = FALSE`;
            case 'like':
               return `${alias}.${column} LIKE '%${subValue}%'`;
            case 'notLike':
               return `${alias}.${column} NOT LIKE '%${subValue}%'`;
            case 'matches':
               return `${alias}.${column} REGEXP '${subValue}'`;
            default:
               return '';
         }
      })
      .join(' AND ');
   return `(${subConditions})`;
}

export default BuildWhereCondition;