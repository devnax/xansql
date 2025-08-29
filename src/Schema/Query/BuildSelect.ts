import Schema from ".."
import { LimitArgs, OrderByArgs, SelectArgs, WhereArgs } from "./types"

export type BuildSelectJoinInfo = BuildSelectInfo & {
   in_column: string,
   parent: {
      table: string,
      single: boolean,
      column: string,
      relation: string
   }
   where: WhereArgs,
   limit: LimitArgs,
   orderBy: OrderByArgs
}

export type BuildSelectJoinType = {
   [column: string]: BuildSelectJoinInfo
}

export interface BuildSelectInfo {
   sql: string
   columns: string[]
   table: string;
   joins: BuildSelectJoinType;
}

const BuildSelect = (args: SelectArgs, schema: Schema) => {
   const info: BuildSelectInfo = {
      sql: "",
      table: schema.table,
      columns: [],
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
      // const relation = schema.xansql.getRelation(schema.table, column)
      const foreign = schema.getForeign(column)
      if (!xanv && !foreign) {
         throw new Error("Invalid column in select clause: " + column)
      };

      const _selectVal: any = args[column]

      if (foreign) {
         const FModel = schema.xansql.getSchema(foreign.table)
         const relationSelect = _selectVal?.select || {}
         const relationWhere = _selectVal?.where || {}
         const relationLimit = _selectVal?.limit || undefined
         const relationOrderBy = _selectVal?.orderBy || undefined

         if (Object.keys(relationSelect).length === 0 || _selectVal === true) {
            for (let col of FModel.columns.main) {
               relationSelect[col] = true
            }
         }

         const buildJoinSelect = BuildSelect(relationSelect, FModel)
         let fcol = `${FModel.table}.${foreign.relation.main}`
         if (!buildJoinSelect.columns.includes(fcol)) {
            buildJoinSelect.columns.push(fcol)
         }
         buildJoinSelect.sql = `SELECT ${buildJoinSelect.columns.join(", ") || "*"} FROM ${FModel.table}`
         info.joins[column] = {
            in_column: foreign.relation.main,
            parent: {
               table: schema.table,
               single: schema.isSingleRelation(column),
               column,
               relation: foreign.relation.target
            },
            where: relationWhere,
            limit: relationLimit || {},
            orderBy: relationOrderBy || {},
            ...buildJoinSelect,
         }
      } else {
         if (_selectVal === true) {
            info.columns.push(`${schema.table}.${column}`)
         } else if (_selectVal === false) {
            continue
         } else {
            throw new Error("Invalid select value for column " + column)
         }
      }
   }

   if (info.columns.length === 0) {
      schema.columns.main.forEach((col) => {
         info.columns.push(`${schema.table}.${col}`)
      })
   } else {
      if (!info.columns.includes(schema.IDColumn)) {
         info.columns.unshift(`${schema.table}.${schema.IDColumn}`)
      }
   }

   info.sql = `SELECT ${info.columns.join(", ") || "*"} FROM ${schema.table}`
   return info
}

export default BuildSelect