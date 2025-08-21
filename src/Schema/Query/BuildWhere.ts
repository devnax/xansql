import Schema from ".."
import XqlArray from "../../Types/fields/Array"
import XqlFile from "../../Types/fields/File"
import XqlMap from "../../Types/fields/Map"
import XqlObject from "../../Types/fields/Object"
import XqlRecord from "../../Types/fields/Record"
import XqlSet from "../../Types/fields/Set"
import { formatValue, isObject } from "../../utils"
import { WhereArgs } from "../type"
import BuildWhereCondition from "./BuildWhereCondition"

const BuildWhere = (where: WhereArgs, schema: Schema, aliases: { [key: string]: number } = {}) => {
   let alias = `${schema.alias + (aliases[schema.alias] || "")}`
   aliases[schema.alias] = (aliases[schema.alias] || 0) + 1
   let info = {
      alias,
      wheres: [] as string[],
      whereArgs: {} as any,
      relations: {} as { [column: string]: { where: object } }
   }

   for (let column in where) {
      const xanv = schema.schema[column]
      const relations = schema.xansql.getRelations(schema.table)
      if (!xanv && !(column in relations)) {
         throw new Error("Invalid column in where clause: " + column)
      };

      const isNotAllowed = xanv instanceof XqlArray
         || xanv instanceof XqlObject
         || xanv instanceof XqlSet
         || xanv instanceof XqlMap
         || xanv instanceof XqlRecord
         || xanv instanceof XqlFile

      if (isNotAllowed) {
         throw new Error(`Invalid type in where clause for column ${column}`)
      }

      if (Array.isArray(where[column])) {
         const subConditions = where[column].map((v: any) => {
            return BuildWhere(v, schema, { ...aliases }).wheres.join(" AND ")
         }).join(" OR ")

         console.log(subConditions);

         info.wheres.push(`(${subConditions})`)
      } else if (relations[column]) {
         const relation = relations[column]
         const foreginModel = schema.xansql.getSchema(relation.foregin.table)
         const _where: any = where[column] || {}
         if (!info.relations[column]) {
            info.relations[column] = {
               where: where[column] as any
            }
         }
         const build = BuildWhere(_where, foreginModel, aliases)
         let _alias = build.alias
         info.wheres.push(`EXISTS (SELECT 1 FROM ${relation.foregin.table} ${_alias} WHERE ${_alias}.${relation.foregin.column} = ${alias}.${relation.main.column} ${build.wheres.length ? ` AND ${build.wheres.join(" AND ")}` : ""})`)
      } else {
         let v = ``
         if (isObject(where[column])) {
            const subConditions = BuildWhereCondition(column, (where as any)[column], alias)
            v = subConditions
         } else {
            xanv.parse(where[column])
            if (where[column] === null) {
               v = `${alias}.${column} IS NULL`
            } else if (where[column] === undefined) {
               v = `${alias}.${column} IS NOT NULL`
            } else {
               v = `${alias}.${column} = ${formatValue(where[column])}`
            }
         }
         info.wheres.push(v)
      }
   }

   console.log(info);

   return info
}

export default BuildWhere;