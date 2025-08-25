import Schema from ".."
import { isObject } from "../../utils"
import { SelectArgs } from "./types"


const BuildSelect = (args: SelectArgs, schema: Schema) => {
   const info: any = {
      sql: "",
      columns: [],
      table: schema.table,
      joins: {}
   }

   const keys = Object.keys(args)
   if (keys.length === 0) {
      for (let column of schema.columns.main) {
         args[column] = true
      }
   }

   for (let column in args) {
      const xanv = schema.schema[column]
      const relations = schema.xansql.getRelations(schema.table)
      if (!xanv && !(column in relations)) {
         throw new Error("Invalid column in select clause: " + column)
      };

      const _selectVal: any = args[column]

      if (relations[column]) {
         if (!isObject(_selectVal)) {
            throw new Error("Invalid select value for relation " + column)
         }
         const relation = relations[column]
         const foreginModel = schema.xansql.getSchema(relation.foregin.table)
         if (!foreginModel) {
            throw new Error("Foregin model not found for relation " + column)
         }

         if (_selectVal === false) {
            continue
         }

         const relationSelect = _selectVal.select || {}
         const relationWhere = _selectVal.where || {}
         const relationLimit = _selectVal.limit || undefined
         const relationOrderBy = _selectVal.orderBy || undefined

         if (Object.keys(relationSelect).length === 0) {
            for (let col of foreginModel.columns.main) {
               relationSelect[col] = true
            }
         }

         const buildJoinSelect = BuildSelect(relationSelect, foreginModel)

         info.joins[column] = {
            ...buildJoinSelect,
            args: {
               where: relationWhere,
               limit: relationLimit || {},
               orderBy: relationOrderBy || {}
            }
         }
      } else {
         if (_selectVal === true) {
            info.columns.push(`\`${schema.alias}\`.\`${column}\``)
         } else if (_selectVal === false) {
            continue
         } else {
            throw new Error("Invalid select value for column " + column)
         }
      }
   }
   info.sql = `SELECT ${info.columns.join(", ") || "*"} FROM \`${schema.table}\` AS \`${schema.alias}\``
   return info
}

export default BuildSelect