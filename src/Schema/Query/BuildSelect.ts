import Schema from ".."
import { RelationInfo } from "../../type"
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

export type BuildSelectJoinType = {
   [column: string]: BuildSelectJoinInfo
}

export interface BuildSelectInfo {
   sql: string
   columns: string[]
   table: string;
   joins: BuildSelectJoinType;
   relation?: RelationInfo
}

const BuildSelect = (args: SelectArgs, schema: Schema, relation?: RelationInfo) => {
   const info: BuildSelectInfo = {
      sql: "",
      columns: [],
      table: schema.table,
      relation,
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
      const relation = schema.xansql.getRelation(schema.table, column)
      if (!xanv && !relation) {
         throw new Error("Invalid column in select clause: " + column)
      };

      const _selectVal: any = args[column]

      if (relation) {
         const foreginModel = schema.xansql.getSchema(relation.foregin.table)
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
      const foregin = schema.xansql.getSchema(relation.foregin.table)
      let col = `\`${foregin.alias}\`.\`${relation.foregin.column}\``
      if (relation.single) {
         col = `\`${schema.alias}\`.\`${foregin.IDColumn}\``
      }
      if (!info.columns.includes(col)) {
         info.columns.push(col)
      }
   }

   info.sql = `SELECT ${info.columns.join(", ") || "*"} FROM \`${schema.table}\` AS \`${schema.alias}\``
   return info
}

export default BuildSelect