import { isObject } from "../../utils";
import { WhereSubCondition } from "./types";
import Schema from "..";

const BuildWhereCondition = (column: string, conditions: WhereSubCondition, alias: string, schema: Schema): string => {
   const generate = Object.keys(conditions).map((subKey) => {
      let val = (conditions as any)[subKey];
      if (val === null) return `${alias}.${column} IS NULL`;
      if (val === undefined) return `${alias}.${column} IS NOT NULL`;
      if (val === "") return `${alias}.${column} = ''`;
      if (val === false) return `${alias}.${column} = FALSE`;
      if (val === true) return `${alias}.${column} = TRUE`;
      if (isObject(val)) {
         throw new Error(`Invalid value ${val} for ${alias}.${column}`);
      }
      if (Array.isArray(val)) {
         if (['in', 'notIn'].includes(subKey)) {
            val = val.map((item) => schema.toSql(column, item)).join(", ");
         } else if (['between', 'notBetween'].includes(subKey)) {
            if (val.length !== 2) {
               throw new Error(`Invalid value ${val} for ${alias}.${column}. Between requires an array of two values.`);
            }
            val = val.map((item) => schema.toSql(column, item)).join(" AND ");
         } else {
            throw new Error(`Invalid array value ${val} for ${alias}.${column} with operator ${subKey}`);
         }
      } else {
         val = schema.toSql(column, val);
      }

      switch (subKey) {
         case 'equals':
            return `${alias}.${column} = ${val}`;
         case 'not':
            return `${alias}.${column} != ${val}`;
         case 'lt':
            return `${alias}.${column} < ${val}`;
         case 'lte':
            return `${alias}.${column} <= ${val}`;
         case 'gt':
            return `${alias}.${column} > ${val}`;
         case 'gte':
            return `${alias}.${column} >= ${val}`;
         case 'in':
            return `${alias}.${column} IN (${val})`;
         case 'notIn':
            return `${alias}.${column} NOT IN (${val})`;
         case 'between':
            return `${alias}.${column} BETWEEN ${val}`;
         case 'notBetween':
            return `${alias}.${column} NOT BETWEEN ${val}`;
         case 'contains':
            return `${alias}.${column} LIKE '%${val}%'`;
         case 'notContains':
            return `${alias}.${column} NOT LIKE '%${val}%'`;
         case 'startsWith':
            return `${alias}.${column} LIKE '${val}%'`;
         case 'endsWith':
            return `${alias}.${column} LIKE '%${val}'`;
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
            return `${alias}.${column} LIKE '%${val}%'`;
         case 'notLike':
            return `${alias}.${column} NOT LIKE '%${val}%'`;
         default:
            throw new Error("Invalid operator in where clause: " + subKey);
      }
   });

   return `(${generate.join(' AND ')})`;
}

export default BuildWhereCondition;