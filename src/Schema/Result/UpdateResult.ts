import Schema from "..";
import XqlDate from "../../Types/fields/Date";
import XqlIDField from "../../Types/fields/IDField";
import { isObject } from "../../utils";
import WhereArgs from "../Args/WhereArgs";
import Foreign from "../include/Foreign";
import { UpdateArgs, UpdateDataRelationArgs } from "../type";
import FindResult from "./FindResult";

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

      // hooks beforeUpdate
      if (this.model.options.hooks?.beforeUpdate) {
         const res = await this.model.options.hooks.beforeUpdate(args.data, args.where)
         args.data = res
      }

      const xansql = this.model.xansql
      const model = this.model
      const data = this.formatData(args.data)
      const Where = new WhereArgs(model, args.where || {})
      const where_sql = Where.sql
      if (!where_sql) {
         throw new Error(`Update operation requires a valid where clause to prevent mass updates in ${model.table} model.`);
      }


      const count = await this.model.count({ where: args.where })
      if (count === 0) return []
      if (count > model.xansql.config.maxLimit.update) {
         throw new Error(`Update operation exceeds the maximum limit of ${model.xansql.config.maxLimit.update} rows in ${model.table} model. Found ${count} rows matching the where clause.`);
      }
      if (data.columns.length === 0) {
         throw new Error(`No valid columns to update in ${model.table} model.`);
      }

      let sql = `UPDATE ${model.table} SET ${data.sql} ${where_sql}`

      const result = await model.execute(sql)

      if (result.affectedRows) {
         if (data.relations.length) {

            const get = await this.finder.result({
               where: args.where,
               select: {
                  [model.IDColumn]: true,
               }
            })
            const updatedItem = get?.[0];

            for (let col of data.relations) {
               let relation = (args.data as any)[col] || {} as UpdateDataRelationArgs

               if (relation.create) {
                  if (!get.length) continue;
                  let foreign = Foreign.info(model, col)
                  if (meta && foreign.table === meta.table) {
                     throw new Error(`Circular reference detected for relation ${col} in update data. table: ${model.table}`);
                  }
                  let FModel = model.xansql.getModel(foreign.table)
                  let cargs = {
                     data: Array.isArray(relation.create.data) ? relation.create.data.map((d: any) => ({
                        ...d,
                        [foreign.column]: updatedItem[model.IDColumn]
                     })) : {
                        ...relation.create.data,
                        [foreign.column]: updatedItem[model.IDColumn]
                     }
                  }
                  await FModel.create(cargs)
               }

               if (relation.update) {
                  let foreign = Foreign.info(model, col)
                  if (meta && foreign.table === meta.table) {
                     throw new Error(`Circular reference detected for relation ${col} in update data. table: ${model.table}`);
                  }
                  let FModel = model.xansql.getModel(foreign.table)
                  let rargs: UpdateArgs = {
                     data: relation.update.data,
                     where: {
                        ...relation.update.where || {},
                        [foreign.column]: args.where
                     }
                  }

                  const r = new UpdateResult(FModel)
                  await r.result(rargs, {
                     table: model.table,
                  })
               }

               if (relation.delete) {
                  let foreign = Foreign.info(model, col)
                  if (meta && foreign.table === meta.table) {
                     throw new Error(`Circular reference detected for relation ${col} in update data. table: ${model.table}`);
                  }
                  let FModel = model.xansql.getModel(foreign.table)
                  let dargs = {
                     where: {
                        ...relation.delete.where || {},
                        [foreign.column]: args.where
                     }
                  }
                  await FModel.delete(dargs)
               }

               if (relation.upsert) {
                  let foreign = Foreign.info(model, col)
                  if (meta && foreign.table === meta.table) {
                     throw new Error(`Circular reference detected for relation ${col} in update data. table: ${model.table}`);
                  }
                  let FModel = model.xansql.getModel(foreign.table)
                  let uargs: UpdateArgs = {
                     data: relation.upsert.data,
                     where: {
                        ...relation.upsert.where || {},
                        [foreign.column]: args.where
                     }
                  }

                  const found = await FModel.count(uargs.where)

                  if (found) {
                     const r = new UpdateResult(FModel)
                     const l = await r.result(uargs)

                  } else {
                     let cargs = {
                        data: {
                           ...relation.upsert.data,
                           [foreign.column]: updatedItem[model.IDColumn]
                        }
                     }

                     await FModel.create(cargs)
                  }
               }


               // if (!val) {
               //    throw new Error(`No data for relation ${col} in update data. table: ${model.table}`);
               // }

               // let foreign = model.xansql.foreignInfo(model.table, col) as ForeignInfo
               // if (meta && foreign.table === meta.table) {
               //    throw new Error(`Circular reference detected for relation ${col} in update data. table: ${model.table}`);
               // }
               // let FModel = model.xansql.getModel(foreign.table)
               // let rargs: UpdateArgs = {
               //    data: val.data,
               //    where: {
               //       ...val.where || {},
               //       [foreign.column]: args.where
               //    }
               // }

               // const r = new UpdateResult(FModel)
               // await r.result(rargs, {
               //    table: model.table,
               // })
            }
         }

         const find = await this.finder.result({
            select: args.select,
            where: args.where
         })

         // hooks afterUpdate
         if (this.model.options.hooks?.afterUpdate) {
            const res = await this.model.options.hooks.afterUpdate(find, args.data, args.where)
            return res
         }

         return find
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
         if (Foreign.is(schema[column]) && isObject(value)) {
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