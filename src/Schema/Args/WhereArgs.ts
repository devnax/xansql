import Schema from "..";
import Foreign from "../../core/classes/ForeignInfo";
import XqlArray from "../../Types/fields/Array";
import XqlFile from "../../Types/fields/File";
import XqlObject from "../../Types/fields/Object";
import XqlRecord from "../../Types/fields/Record";
import XqlTuple from "../../Types/fields/Tuple";
import { escapeSqlValue, isArray, isObject } from "../../utils";
import ValueFormatter from "../include/ValueFormatter";
import { WhereArgsType, WhereSubCondition } from "../type";

type Meta = {
   parentTable: string
}

class WhereArgs {
   private model: Schema
   // private where: WhereArgsType
   // private meta: Meta | undefined
   readonly wheres: string[]
   readonly sql: string = ''
   private condition_keys = ["equals", "not", "lt", "lte", "gt", "gte", "in", "notIn", "between", "notBetween", "contains", "notContains", "startsWith", "endsWith", "isNull", "isNotNull", "isEmpty", "isNotEmpty", "isTrue", "isFalse"]

   constructor(model: Schema, where: WhereArgsType, meta?: Meta) {
      this.model = model

      let schema = model.schema
      let wheres: string[] = []

      for (let column in where) {
         this.checkIsAllowed(column)
         const value: any = where[column]
         const field = schema[column]

         if (Foreign.is(field)) {
            if (!isArray(value) && !isObject(value)) {
               throw new Error(`${column} must be an object or array in the WHERE clause, but received ${typeof value} in table ${model.table}`);
            } else if (isObject(value) && Object.keys(value).length === 0 || isArray(value) && value.length === 0) {
               // skip empty object
               continue;
            }

            if (Foreign.isSchema(field) && isObject(value) && Object.keys(value).some(k => this.condition_keys.includes(k))) {
               const v = this.condition(column, value as WhereSubCondition)
               wheres.push(v)
               continue
            }

            let foreign = Foreign.get(model, column)
            let FModel = model.xansql.getModel(foreign.table)
            if (meta && meta.parentTable === foreign.table) {
               throw new Error(`Circular reference detected in where clause for ${model.table}.${column}`);
            }
            let _sql = ''
            if (Array.isArray(value)) {
               let _ors = []
               for (let w of value) {
                  if (!isObject(w)) throw new Error(`${column} must be an object in the WHERE clause, but received ${typeof w} in table ${model.table}`)

                  const where = new WhereArgs(FModel, w, { parentTable: model.table })
                  if (where.sql) {
                     _ors.push(`(${where.wheres.join(" AND ")})`)
                  }
               }
               _sql = _ors.length ? `(${_ors.join(" OR ")})` : ""
            } else if (isObject(value)) {
               const where = new WhereArgs(FModel, value, { parentTable: model.table })

               if (where.sql) {
                  _sql = where.wheres.join(" AND ")
               }
            } else {
               throw new Error(`${column} must be an object or array in the WHERE clause, but received ${typeof value} in table ${model.table}`);
            }

            wheres.push(`EXISTS (SELECT 1 FROM ${foreign.table} WHERE ${foreign.sql} ${_sql ? ` AND ${_sql}` : ""})`)
         } else {
            let v = ''
            if (Array.isArray(value)) {
               const sub = value.map((_v: any) => {
                  return isObject(_v)
                     ? this.condition(column, _v)
                     : `${model.table}.${column} = ${ValueFormatter.toSql(model, column, _v)}`
               })
               v = `(${sub.join(" OR ")})`
            } else if (isObject(value)) {
               v = this.condition(column, value)
            } else {
               v = `${model.table}.${column} = ${ValueFormatter.toSql(model, column, value)}`
            }
            wheres.push(v)
         }
      }

      this.wheres = wheres
      this.sql = this.wheres.length ? `WHERE ${this.wheres.join(" AND ")} ` : ""
   }

   private condition(column: string, conditions: WhereSubCondition) {
      const model = this.model
      const generate = Object.keys(conditions).map((subKey) => {
         let value = (conditions as any)[subKey];
         if (isObject(value)) {
            throw new Error(`Invalid value ${value} for ${model.table}.${column}`);
         }
         let val: string = value;
         if (Array.isArray(val)) {
            if (['in', 'notIn'].includes(subKey)) {
               val = val.map((item) => ValueFormatter.toSql(model, column, item)).join(", ");
            } else if (['between', 'notBetween'].includes(subKey)) {
               if (val.length !== 2) {
                  throw new Error(`Invalid value ${val} for ${model.table}.${column}. Between requires an array of two values.`);
               }
               val = val.map((item) => ValueFormatter.toSql(model, column, item)).join(" AND ");
            } else {
               throw new Error(`Invalid array value ${val} for ${model.table}.${column} with operator ${subKey}`);
            }
         } else if (typeof val === 'boolean') {
            val = val ? "1" : "0";
         } else {
            val = ValueFormatter.toSql(model, column, val);
         }

         let col = model.table + "." + column;
         switch (subKey) {
            case 'equals':
               if (val === "NULL") return `${col} IS NULL`;
               return `${col} = ${val}`;
            case 'not':
               if (val === "NULL") return `${col} IS NOT NULL`;
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
               if (val?.length === 0) {
                  return `1 = 0`;
               } else if (!val.includes(",")) {
                  return `${col} = ${val}`;
               }
               return `${col} IN (${val})`;
            case 'notIn':
               // handle empty array and val is a single value
               if (val.length === 0) {
                  return `1 = 1`;
               } else if (!val.includes(",")) {
                  return `${col} != ${val}`;
               }
               return `${col} NOT IN (${val})`;
            case 'between':
               return `${col} BETWEEN (${val})`;
            case 'notBetween':
               return `${col} NOT BETWEEN (${val})`;
            case 'contains':
               return `${col} LIKE '%${escapeSqlValue(value)}%'`;
            case 'notContains':
               return `${col} NOT LIKE '%${escapeSqlValue(value)}%'`;
            case 'startsWith':
               return `${col} LIKE '${escapeSqlValue(value)}%'`;
            case 'endsWith':
               return `${col} LIKE '%${escapeSqlValue(value)}'`;
            case 'isNull':
               return `${col} IS NULL`;
            case 'isNotNull':
               return `${col} IS NOT NULL`;
            case 'isEmpty':
               return `(${col} IS NULL OR LENGTH(${col}) = 0)`;
            case 'isNotEmpty':
               return `(WHERE ${col} IS NOT NULL AND LENGTH(${col}) > 0)`;
            case 'isTrue':
               return `${col} = TRUE`;
            case 'isFalse':
               return `${col} = FALSE`;
            default:
               throw new Error(`Invalid operator in where clause: ${subKey} for ${model.table}.${column}`);
         }
      });

      return `${generate.join(' AND ')}`;
   }

   private checkIsAllowed(column: string) {
      const xanv = this.model.schema[column]
      if (Foreign.isArray(xanv)) return true
      const isNotAllowed = xanv instanceof XqlArray
         || xanv instanceof XqlObject
         || xanv instanceof XqlRecord
         || xanv instanceof XqlTuple
      // || xanv instanceof XqlFile

      if (isNotAllowed) {
         throw new Error(`${column} is not allowed in where clause in table ${this.model.table}`);
      }
   }
}

export default WhereArgs;