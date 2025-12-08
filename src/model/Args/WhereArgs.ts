import Model from "..";
import Foreign from "../../core/classes/ForeignInfo";
import XansqlError from "../../core/XansqlError";
import XqlArray from "../../xt/fields/Array";
import XqlObject from "../../xt/fields/Object";
import XqlRecord from "../../xt/fields/Record";
import XqlTuple from "../../xt/fields/Tuple";
import { escapeSqlValue, iof, isArray, isObject } from "../../utils";
import ValueFormatter from "../include/ValueFormatter";
import { WhereArgsType, WhereSubCondition } from "../types";
import XqlFile from "../../xt/fields/File";

type Meta = {
   parentTable: string
}

class WhereArgs {
   private model: Model
   // private where: WhereArgsType
   // private meta: Meta | undefined
   readonly wheres: string[]
   readonly sql: string = ''
   private condition_keys = ["equals", "not", "lt", "lte", "gt", "gte", "in", "notIn", "between", "notBetween", "contains", "notContains", "startsWith", "endsWith", "isNull", "isNotNull", "isEmpty", "isNotEmpty", "isTrue", "isFalse"]

   constructor(model: Model, where: WhereArgsType | WhereArgsType[], meta?: Meta) {
      this.model = model

      let schema = model.schema
      let wheres: string[] = []

      if (Array.isArray(where)) {
         let _ors = []
         for (let w of where) {
            const whereArgs = new WhereArgs(model, w, meta)
            if (whereArgs.sql) {
               if (whereArgs.wheres.length > 1) {
                  _ors.push(`(${whereArgs.wheres.join(" AND ")})`)
               } else {
                  _ors.push(`${whereArgs.wheres.join(" AND ")}`)
               }
            }
         }

         if (_ors.length) {
            wheres.push(`(${_ors.join(" OR ")})`)
         }
      } else {
         for (let column in where) {
            this.checkIsAllowed(column)
            const value: any = where[column]
            const field = schema[column]

            if (Foreign.is(field)) {
               if (!isArray(value) && !isObject(value)) {
                  throw new XansqlError({
                     message: `${column} must be an object or array in the WHERE clause, but received ${typeof value} in table ${model.table}`,
                     model: model.table,
                     column
                  });
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
                  throw new XansqlError({
                     message: `Circular reference detected in WHERE clause for table ${model.table} on column ${column}`,
                     model: model.table,
                     column
                  });
               }
               let _sql = ''
               if (Array.isArray(value) || isObject(value)) {
                  const where = new WhereArgs(FModel, value, { parentTable: model.table })
                  if (where.sql) {
                     _sql = where.wheres.join(" AND ")
                  }
               } else {
                  throw new XansqlError({
                     message: `Invalid value for foreign key ${column} in WHERE clause of table ${model.table}`,
                     model: model.table,
                     column
                  });
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
                  if (sub.length > 1) {
                     v = `(${sub.join(" OR ")})`
                  } else {
                     v = sub.join(" OR ")
                  }
               } else if (isObject(value)) {
                  v = this.condition(column, value)
               } else {
                  v = `${model.table}.${column} = ${ValueFormatter.toSql(model, column, value)}`
               }
               wheres.push(v)
            }
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
            throw new XansqlError({
               message: `Invalid value for where condition ${subKey} on column ${column} in table ${model.table}`,
               model: model.table,
               column
            });
         }
         let val: string = value;
         if (Array.isArray(val)) {
            if (['in', 'notIn'].includes(subKey)) {
               val = val.map((item) => ValueFormatter.toSql(model, column, item)).join(", ");
            } else if (['between', 'notBetween'].includes(subKey)) {
               if (val.length !== 2) {
                  throw new XansqlError({
                     message: `The 'between' and 'notBetween' operators require an array of exactly two values for column ${column} in table ${model.table}.`,
                     model: model.table,
                     column
                  });
               }
               val = val.map((item) => ValueFormatter.toSql(model, column, item)).join(" AND ");
            } else {
               throw new XansqlError({
                  message: `Array value is not supported for operator ${subKey} on column ${column} in table ${model.table}.`,
                  model: model.table,
                  column
               });
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
               throw new XansqlError({
                  message: `Unknown where condition ${subKey} on column ${column} in table ${model.table}`,
                  model: model.table,
                  column
               });
         }
      });

      return `${generate.join(' AND ')}`;
   }

   private checkIsAllowed(column: string) {
      const field = this.model.schema[column]
      if (Foreign.isArray(field)) return true
      const isNotAllowed = iof(field, XqlArray, XqlObject, XqlRecord, XqlTuple, XqlFile)

      if (isNotAllowed) {
         throw new XansqlError({
            message: `Field ${column} of type ${field.constructor.name} is not allowed in WHERE clause in table ${this.model.table}`,
            model: this.model.table,
            column
         });
      }
   }
}

export default WhereArgs;