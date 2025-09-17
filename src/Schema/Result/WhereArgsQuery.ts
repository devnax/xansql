import Schema from "..";
import XqlArray from "../../Types/fields/Array";
import XqlFile from "../../Types/fields/File";
import XqlObject from "../../Types/fields/Object";
import XqlRecord from "../../Types/fields/Record";
import XqlTuple from "../../Types/fields/Tuple";
import { escapeSqlValue, isArray, isNumber, isObject } from "../../utils";
import { WhereArgs, WhereSubCondition } from "../type";

type Meta = {
   parentTable: string
}

class WhereArgsQuery {
   private model: Schema
   private where: WhereArgs
   private meta: Meta | undefined
   private _wheres: string[] | null = null
   private condition_keys = ["equals", "not", "lt", "lte", "gt", "gte", "in", "notIn", "between", "notBetween", "contains", "notContains", "startsWith", "endsWith", "isNull", "isNotNull", "isEmpty", "isNotEmpty", "isTrue", "isFalse"]

   constructor(model: Schema, where: WhereArgs, meta?: Meta) {
      this.model = model
      this.where = where
      this.meta = meta
   }

   get is() {
      return this.wheres.length > 0
   }

   get wheres() {

      if (this._wheres) return this._wheres
      let xansql = this.model.xansql
      let model = this.model
      let schema = model.schema

      let wheres: string[] = []

      for (let column in this.where) {
         this.isAllowed(column)
         const value: any = this.where[column]



         if (xansql.isForeign(schema[column])) {
            if (isObject(value)) {
               if (Object.keys(value).every(k => this.condition_keys.includes(k))) {
                  const cond = this.condition(column, value as WhereSubCondition)
                  wheres.push(cond)
                  continue
               }
            } else if (value === null) {
               wheres.push(`${model.table}.${column} IS NULL`)
               continue
            } else if (isNumber(value)) {
               wheres.push(`${model.table}.${column} = ${model.toSql(column, value)}`)
               continue
            }

            let foreign = xansql.foreignInfo(model.table, column)
            let FModel = model.xansql.getModel(foreign.table)
            if (this.meta && this.meta.parentTable === foreign.table) {
               throw new Error(`Circular reference detected in where clause for ${model.table}.${column}`);
            }
            let _sql = ''
            if (Array.isArray(value)) {
               let _ors = []
               for (let w of value) {
                  if (!isObject(w)) {
                     throw new Error(`${column} must be an object in the WHERE clause, but received ${typeof w}`);
                  }
                  const where = new WhereArgsQuery(FModel, w, { parentTable: model.table })
                  if (where.is) {
                     _ors.push(`(${where.wheres.join(" AND ")})`)
                  }
               }
               _sql = _ors.length ? `(${_ors.join(" OR ")})` : ""
            } else if (isObject(value)) {
               const where = new WhereArgsQuery(FModel, value, { parentTable: model.table })
               if (where.is) {
                  _sql = where.wheres.join(" AND ")
               }
            } else {
               throw new Error(`${column} must be an object or array in the WHERE clause, but received ${typeof value}`);
            }

            wheres.push(`EXISTS (SELECT 1 FROM ${foreign.table} WHERE ${foreign.table}.${foreign.relation.main} = ${model.table}.${foreign.relation.target} ${_sql ? ` AND ${_sql}` : ""})`)
         } else {
            let v = ''
            if (Array.isArray(value)) {
               const sub = value.map((_v: any) => {
                  return isObject(_v)
                     ? this.condition(column, _v)
                     : `${model.table}.${column} = ${model.toSql(column, _v)}`
               })
               v = `(${sub.join(" OR ")})`
            } else if (isObject(value)) {
               v = this.condition(column, value)
            } else {
               v = `${model.table}.${column} = ${model.toSql(column, value)}`
            }
            wheres.push(v)
         }
      }
      this._wheres = wheres
      return wheres
   }

   get sql() {
      const wheres = this.wheres
      return wheres.length ? `WHERE ${wheres.join(" AND ")}` : ""
   }

   condition(column: string, conditions: WhereSubCondition) {
      const model = this.model
      const generate = Object.keys(conditions).map((subKey) => {
         let value = (conditions as any)[subKey];
         if (value === null) return `${model.table}.${column} IS NULL`;
         if (value === undefined) return `${model.table}.${column} IS NOT NULL`;
         if (value === "") return `${model.table}.${column} = ''`;
         if (value === false) return `${model.table}.${column} = FALSE`;
         if (value === true) return `${model.table}.${column} = TRUE`;
         if (isObject(value)) {
            throw new Error(`Invalid value ${value} for ${model.table}.${column}`);
         }
         let val: any = value;
         if (Array.isArray(val)) {
            if (['in', 'notIn'].includes(subKey)) {
               val = val.map((item) => model.toSql(column, item)).join(", ");
            } else if (['between', 'notBetween'].includes(subKey)) {
               if (val.length !== 2) {
                  throw new Error(`Invalid value ${val} for ${model.table}.${column}. Between requires an array of two values.`);
               }
               val = val.map((item) => model.toSql(column, item)).join(" AND ");
            } else {
               throw new Error(`Invalid array value ${val} for ${model.table}.${column} with operator ${subKey}`);
            }
         } else {
            val = model.toSql(column, val);
         }

         let col = model.table + "." + column;
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
               return `${col} = ${val}`;
            case 'isFalse':
               return `${col} = ${val}`;
            default:
               throw new Error("Invalid operator in where clause: " + subKey);
         }
      });

      return `${generate.join(' AND ')}`;
   }

   private isAllowed(column: string) {
      const xanv = this.model.schema[column]
      if (this.model.xansql.isForeignArray(xanv)) {
         return true
      }
      const isNotAllowed = xanv instanceof XqlArray
         || xanv instanceof XqlObject
         || xanv instanceof XqlRecord
         || xanv instanceof XqlTuple
         || xanv instanceof XqlFile

      if (isNotAllowed) {
         throw new Error(`${column} is not allowed in where clause`)
      }
   }
}

export default WhereArgsQuery;