import Schema from ".."
import XqlArray from "../../Types/fields/Array"
import XqlFile from "../../Types/fields/File"
import XqlMap from "../../Types/fields/Map"
import XqlObject from "../../Types/fields/Object"
import XqlRecord from "../../Types/fields/Record"
import XqlSet from "../../Types/fields/Set"
import XqlTuple from "../../Types/fields/Tuple"
import { isObject } from "../../utils"
import { WhereArgs } from "./types"
import BuildWhereCondition from "./BuildWhereCondition"

const BuildWhere = (where: WhereArgs, schema: Schema, isRelation = false) => {
   let info = {
      wheres: [] as string[],
      sql: "",
   }

   for (let column in where) {
      const xanv = schema.schema[column]
      const foreign = schema.getForeign(column)
      if (!xanv && !foreign) {
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

      if (foreign) {
         let FModel = schema.xansql.getSchema(foreign.table)
         const isArray = Array.isArray(_whereVal)
         let _alias = ''
         let _sql = ''
         if (isArray) {
            let _ors = []
            for (let w of _whereVal) {
               if (!isObject(w)) {
                  throw new Error("Invalid value in where clause for relation array " + column)
               }
               const build = BuildWhere(w, FModel, true)
               build.wheres.length && _ors.push(`(${build.wheres.join(" AND ")})`)
            }
            _sql = _ors.length ? `(${_ors.join(" OR ")})` : ""
         } else if (isObject(_whereVal)) {
            const build = BuildWhere(_whereVal, FModel, true)
            _sql = build.wheres.length ? build.wheres.join(" AND ") : ""
         }

         info.wheres.push(`EXISTS (SELECT 1 FROM ${foreign.table} WHERE ${foreign.table}.${foreign.relation.main} = ${schema.table}.${foreign.relation.target} ${_sql ? ` AND ${_sql}` : ""})`)
      } else {
         let v = ''
         if (isObject(_whereVal)) {
            v = BuildWhereCondition(column, _whereVal, schema)
         } else if (Array.isArray(_whereVal)) {
            const subConditions = _whereVal.map((_v: any) => {
               if (isObject(_v)) {
                  return BuildWhereCondition(column, _v, schema)
               }
               return `${schema.table}.${column} = ${schema.toSql(column, _v)}`
            })
            v = `(${subConditions.join(" OR ")})`
         } else {
            let val = schema.toSql(column, _whereVal)
            if (val === "NULL") {
               v = `${schema.table}.${column} IS NULL`
            } else if (val === undefined) {
               v = `${schema.table}.${column} IS NOT NULL`
            } else {
               v = `${schema.table}.${column} = ${val}`
            }
         }
         info.wheres.push(v)
      }
   }

   if (!isRelation && info.wheres.length) {
      info.sql = `WHERE ${info.wheres.join(" AND ")}`
   }
   return info
}

export default BuildWhere;