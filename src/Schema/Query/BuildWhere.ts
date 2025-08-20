import Schema from ".."
import XqlJoin from "../../Types/fields/Join"
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
      const schemaValue = schema.schema[column]
      if (!schemaValue) throw new Error(`Invalid column ${schema.table}.${column}`)
      const is = schemaValue instanceof XqlJoin
      if (is) {
         const relation = schema.getRelation(column)
         const foreginModel = (schema.xansql as any).models[relation.foregin.table]
         const _where: any = where[column] || {}
         if (!info.relations[column]) {
            info.relations[column] = {
               where: where[column] as any
            }
         }
         const build = BuildWhere(_where, foreginModel, aliases)
         let _alias = build.alias
         info.wheres.push(`EXISTS (SELECT 1 FROM ${relation.foregin.table} ${_alias} WHERE ${_alias}.${relation.foregin.column} = ${relation.main.alias}.${relation.main.column} ${build.wheres.length ? ` AND ${build.wheres.join(" AND ")}` : ""})`)
      } else {
         info.whereArgs[column] = where[column]
         let v = ``
         if (isObject(where[column])) {
            const subConditions = BuildWhereCondition(column, (where as any)[column], schema.alias)
            v = subConditions
         } else if (Array.isArray(where[column])) {
            const subConditions = where[column].map((v: any) => {
               if (isObject(v)) {
                  return BuildWhereCondition(column, v, schema.alias)
               } else {
                  return `${alias}.${column} = ${formatValue(v)}`
               }
            }).join(" OR ")
            v = `(${subConditions})`
         } else if (where[column] === null) {
            v = `${alias}.${column} IS NULL`
         } else if (where[column] === undefined) {
            v = `${alias}.${column} IS NOT NULL`
         } else {
            v = `${alias}.${column} = ${formatValue(where[column])}`
         }
         info.wheres.push(v)
      }
   }
   return info
}

export default BuildWhere;