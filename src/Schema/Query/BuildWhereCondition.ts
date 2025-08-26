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
      let col = alias + "." + column;
      switch (subKey) {
         case 'equals':
            return `${col} = ${val}`;
         case 'not':
            return `${col} != ${val}`;
         case 'lt':
            return `${col} < ${val}`;
         case 'lte':
            return `${col} <= ${val}`;
         case 'gt':
            return `${col} > ${val}`;
         case 'gte':
            return `${col} >= ${val}`;
         case 'in':
            return `${col} IN (${val})`;
         case 'notIn':
            return `${col} NOT IN (${val})`;
         case 'between':
            return `${col} BETWEEN (${val})`;
         case 'notBetween':
            return `${col} NOT BETWEEN (${val})`;
         case 'contains':
            return `${col} LIKE '%${val}%'`;
         case 'notContains':
            return `${col} NOT LIKE '%${val}%'`;
         case 'startsWith':
            return `${col} LIKE '${val}%'`;
         case 'endsWith':
            return `${col} LIKE '%${val}'`;
         case 'isNull':
            return `${col} IS NULL`;
         case 'isNotNull':
            return `${col} IS NOT NULL`;
         case 'isEmpty':
            return `(${col} IS NULL OR LENGTH(${col}) = 0)`;
         case 'isNotEmpty':
            return `(WHERE ${col} IS NOT NULL AND LENGTH(${col}) > 0)`;
         case 'isTrue':
            return `${col} = ${val}`;
         case 'isFalse':
            return `${col} = ${val}`;
         default:
            throw new Error("Invalid operator in where clause: " + subKey);
      }
   });

   return `(${generate.join(' AND ')})`;
}

export default BuildWhereCondition;