import Schema from ".."
import { isObject } from "../../utils"
import { GetRelationType } from "../type"
import { LimitArgs, OrderByArgs, SelectArgs, WhereArgs } from "./types"


export type BuildSelectJoinInfo = BuildSelectInfo & {
   args: {
      where: WhereArgs,
      limit?: LimitArgs,
      orderBy?: OrderByArgs
   }
}

export interface BuildSelectInfo {
   sql: string
   columns: string[]
   table: string;
   relationTable: string;
   joins: {
      [column: string]: BuildSelectJoinInfo
   }
}

const BuildSelect = (args: SelectArgs, schema: Schema, relation?: GetRelationType) => {
   const info: any = {
      sql: "",
      columns: [],
      table: schema.table,
      relationTable: relation ? relation.main.table : null,
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

      if (column in relations) {
         const relation: any = relations[column]
         const foreginModel = relation.foregin.schema
         const relationSelect = _selectVal?.select || {}
         const relationWhere = _selectVal?.where || {}
         const relationLimit = _selectVal?.limit || undefined
         const relationOrderBy = _selectVal?.orderBy || undefined

         if (Object.keys(relationSelect).length === 0 || _selectVal === true) {
            for (let col of foreginModel.columns.main) {
               relationSelect[col] = true
            }
         }

         const buildJoinSelect = BuildSelect(relationSelect, foreginModel, relation)

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


   if (info.columns.length === 0) {
      schema.columns.main.forEach((col) => {
         info.columns.push(`\`${schema.alias}\`.\`${col}\``)
      })
   } else {
      if (!info.columns.includes(`\`${schema.alias}\`.\`${schema.IDColumn}\``)) {
         info.columns.unshift(`\`${schema.alias}\`.\`${schema.IDColumn}\``)
      }
   }

   if (relation) {
      let foregin = relation.foregin
      info.columns.push(`\`${foregin.alias}\`.\`${foregin.column}\``)
   }

   info.sql = `SELECT ${info.columns.join(", ") || "*"} FROM \`${schema.table}\` AS \`${schema.alias}\``
   return info
}

export default BuildSelect