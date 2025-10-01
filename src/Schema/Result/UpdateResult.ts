import Schema from "..";
import { ForeignInfo } from "../../type";
import XqlDate from "../../Types/fields/Date";
import XqlIDField from "../../Types/fields/IDField";
import { isObject } from "../../utils";
import { UpdateArgs } from "../type";
import FindResult from "./FindResult";
import WhereArgsQuery from "./WhereArgsQuery";

type MetaInfo = {
   table: string;
}

class UpdateResult {
   finder: FindResult
   model: Schema
   constructor(model: Schema) {
      this.model = model
      this.finder = new FindResult(model)
   }

   async result(args: UpdateArgs, meta?: MetaInfo) {
      if (!args.data || Object.keys(args.data).length === 0 || !args.where || Object.keys(args.where).length === 0) {
         throw new Error("No data to update.");
      }

      const model = this.model
      const data = this.formatData(args.data)
      const Where = new WhereArgsQuery(model, args.where || {})
      const where_sql = Where.sql
      if (!where_sql) {
         throw new Error("Update operation requires a valid where clause to prevent mass updates.");
      }

      const count = await this.model.count({ where: args.where })
      if (count === 0) return []
      if (count > model.xansql.config.maxLimit.update) {
         throw new Error(`Update operation exceeds the maximum limit of ${model.xansql.config.maxLimit.update} rows. Found ${count} rows matching the where clause.`);
      }
      if (data.columns.length === 0) {
         throw new Error("No valid columns to update.");
      }

      let sql = `UPDATE ${model.table} SET ${data.sql} ${where_sql}`
      const result = await model.excute(sql)

      if (result.affectedRows) {
         if (data.relations.length) {
            for (let col of data.relations) {
               let val = (args.data as any)[col]
               if (!val) {
                  throw new Error("No data for relation " + col);
               }

               let foreign = model.xansql.foreignInfo(model.table, col) as ForeignInfo
               if (meta && foreign.table === meta.table) {
                  throw new Error(`Circular reference detected for relation ${col} in update data. table: ${model.table}`);
               }
               let FModel = model.xansql.getModel(foreign.table)
               let rargs: UpdateArgs = {
                  data: val.data,
                  where: {
                     ...val.where || {},
                     [foreign.column]: args.where
                  }
               }

               const r = new UpdateResult(FModel)
               await r.result(rargs, {
                  table: model.table,
               })
            }
         }

         return await this.finder.result({
            select: args.select,
            where: args.where
         })
      }
      return []
   }

   private formatData(data: UpdateArgs["data"]) {
      const model = this.model
      const xansql = model.xansql
      const schema = model.schema
      const relations: string[] = []
      const columns: string[] = []
      const values: any[] = []

      for (const column in data) {
         const field = schema[column]
         if (!field) {
            throw new Error(`Column ${column} does not exist in model ${model.table}`);
         }
         if (field instanceof XqlIDField) {
            throw new Error(`Cannot update ID field: ${column} in table: ${model.table}`);
         }

         let value = (data as any)[column]
         if (xansql.isForeign(schema[column]) && isObject(value)) {
            relations.push(column)
         } else {
            if (field instanceof XqlDate) {
               if (field.meta.create) {
                  if (value !== undefined) {
                     throw new Error(`Cannot set create date field: ${column} in table: ${model.table}`);
                  }
               } else if (field.meta.update) {
                  if (value !== undefined) {
                     throw new Error(`Cannot set update date field: ${column} in table: ${model.table}`);
                  }
                  value = new Date();
               }
            }
            columns.push(column)
            values.push(`${column}=${model.toSql(column, value)}`)
         }
      }

      let sql = ``
      sql += values.join(', ')

      return { sql, columns, relations }
   }

}

export default UpdateResult;