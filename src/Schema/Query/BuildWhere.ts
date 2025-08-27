import Schema from ".."
import XqlArray from "../../Types/fields/Array"
import XqlFile from "../../Types/fields/File"
import XqlMap from "../../Types/fields/Map"
import XqlObject from "../../Types/fields/Object"
import XqlRecord from "../../Types/fields/Record"
import XqlSet from "../../Types/fields/Set"
import XqlTuple from "../../Types/fields/Tuple"
import { formatValue, isObject } from "../../utils"
import { WhereArgs } from "./types"
import BuildWhereCondition from "./BuildWhereCondition"

const BuildWhere = (where: WhereArgs, schema: Schema, aliases: { [key: string]: number } = {}) => {
   let hasAlias = Object.keys(aliases).length > 0
   let alias = `${schema.alias + (aliases[schema.alias] || "")}`
   aliases[schema.alias] = (aliases[schema.alias] || 0) + 1
   let info = {
      alias,
      wheres: [] as string[],
      sql: "",
      // whereArgs: {} as any,
      // relations: {} as { [column: string]: { where: object } }
   }

   for (let column in where) {
      const xanv = schema.schema[column]
      const relation = schema.xansql.getRelation(schema.table, column)
      if (!xanv && !relation) {
         throw new Error("Invalid column in where clause: " + column)
      };

      const isNotAllowed = xanv instanceof XqlArray
         || xanv instanceof XqlObject
         || xanv instanceof XqlSet
         || xanv instanceof XqlMap
         || xanv instanceof XqlRecord
         || xanv instanceof XqlTuple
         || xanv instanceof XqlFile

      if (isNotAllowed) {
         throw new Error(`Invalid type in where clause for column ${column}`)
      }
      const _whereVal: any = where[column]

      if (relation) {
         let foreginModel = schema.xansql.getSchema(relation.foregin.table)
         const isArray = Array.isArray(_whereVal)
         let _alias = ''
         let _sql = ''
         if (isArray) {
            let _ors = []
            for (let w of _whereVal) {
               if (!isObject(w)) {
                  throw new Error("Invalid value in where clause for relation array " + column)
               }
               const build = BuildWhere(w, foreginModel, { ...aliases })
               build.wheres.length && _ors.push(`(${build.wheres.join(" AND ")})`)
               _alias = _alias || build.alias
            }
            _sql = _ors.length ? `(${_ors.join(" OR ")})` : ""
         } else if (isObject(_whereVal)) {
            const build = BuildWhere(_whereVal, foreginModel, aliases)
            _alias = build.alias
            _sql = build.wheres.length ? build.wheres.join(" AND ") : ""
         }
         let _self_col = `\`${_alias}\`.\`${relation.foregin.column}\``
         if (relation.single) {
            _self_col = `\`${_alias}\`.\`${foreginModel.IDColumn}\``
         }

         let foregin_col = `\`${alias}\`.\`${relation.main.column}\``
         if (!relation.single) {
            foregin_col = `\`${alias}\`.\`${schema.IDColumn}\``
         }

         info.wheres.push(`EXISTS (SELECT 1 FROM ${relation.foregin.table} ${_alias} WHERE ${_self_col} = ${foregin_col} ${_sql ? ` AND ${_sql}` : ""})`)
      } else {
         let v = ``
         if (isObject(_whereVal)) {
            v = BuildWhereCondition(column, _whereVal, alias, schema)
         } else if (Array.isArray(_whereVal)) {
            const subConditions = _whereVal.map((_v: any) => {
               if (isObject(_v)) {
                  return BuildWhereCondition(column, _v, alias, schema)
               }
               return `${alias}.${column} = ${schema.toSql(column, _v)}`
            })
            v = `(${subConditions.join(" OR ")})`
         } else {
            let val = schema.toSql(column, _whereVal)
            if (val === "NULL") {
               v = `${alias}.${column} IS NULL`
            } else if (val === undefined) {
               v = `${alias}.${column} IS NOT NULL`
            } else {
               v = `${alias}.${column} = ${val}`
            }
         }
         info.wheres.push(v)
      }
   }

   if (!hasAlias) {
      info.sql = info.wheres.length ? `WHERE ${info.wheres.join(" AND ")}` : ""
   }
   return info
}

export default BuildWhere;