import Schema from "..";
import { ForeignInfo } from "../../type";
import XqlDate from "../../Types/fields/Date";
import XqlIDField from "../../Types/fields/IDField";
import { isArray, isObject } from "../../utils";
import { chunkArray } from "../../utils/chunker";
import { CreateArgs } from "../type";
import DeleteResult from "./DeleteResult";
import FindResult from "./FindResult";

type MetaInfo = {
   table: string;
   insertId?: number,
   column?: string
}

type RelationItems = { [column: string]: { foreign: ForeignInfo, data: CreateArgs } }

class CreateResult {
   finder: FindResult
   model: Schema
   constructor(schema: Schema) {
      this.model = schema
      this.finder = new FindResult(schema)
   }

   async result(args: CreateArgs, meta?: MetaInfo) {

      // hooks beforeCreate
      if (this.model.options.hooks?.beforeCreate) {
         const res = await this.model.options.hooks.beforeCreate(args.data)
         args.data = res
      }

      const model = this.model
      const xansql = model.xansql
      const maxLimit = xansql.config.maxLimit.create
      if (Array.isArray(args.data) && args.data.length === 0) {
         throw new Error(`No data to create in ${model.table} model.`);
      }
      if (Array.isArray(args.data) && args.data.length > maxLimit) {
         throw new Error(`Create operation exceeds in ${model.table} model. the maximum limit of ${maxLimit} rows. Found ${args.data.length} rows to create.`);
      }
      if (!args.data || (isObject(args.data) && Object.keys(args.data).length === 0)) {
         throw new Error(`No data to create in ${model.table} model.`);
      }

      let ids = await this.excute(args, meta)
      if (meta) return ids
      if (ids.length) {
         let results: any[] = []
         for (let { chunk } of chunkArray(ids)) {
            if (args.select) {
               const findArgs: any = {
                  where: {
                     [this.model.IDColumn]: {
                        in: chunk
                     }
                  },
                  limit: { take: chunk.length },
                  select: args.select || {}
               }
               const r = await this.finder.result(findArgs)
               results = results.concat(r)
            } else {
               const r = chunk.map((id: any) => ({ [this.model.IDColumn]: id }))
               results = results.concat(r)
            }
         }

         // hooks afterCreate
         if (this.model.options.hooks?.afterCreate) {
            const res = await this.model.options.hooks.afterCreate(results, args.data)
            results = res
         }
         return results
      }
      throw new Error(`Create failed, no records created in table: ${model.table}`);
   }

   async excute(args: CreateArgs, meta?: MetaInfo) {
      const model = this.model
      const xansql = model.xansql
      const data = args.data

      if (Array.isArray(data)) {
         let allids: number[] = []
         let relations: any = {}
         for (let { chunk } of chunkArray(data)) {
            let relation: any = {}
            for (let item of chunk) {
               const ids = await this.excute({ data: item }, meta)
               if (Object.keys(relation).length) relations[ids[0]] = relation
               allids = allids.concat(ids as number[])
            }
         }
         return allids
      } else {
         const { columns, values, hasManyRelations, hasOneRelations } = this.formatData(data, meta)
         await this.excuteSchema(hasOneRelations, columns, values)
         let sql = `INSERT INTO ${model.table} (${columns.join(",")}) VALUES (${values.join(",")})`
         const result: any = await model.excute(sql)

         if (!result.insertId) {
            for (let col in hasOneRelations) {
               const foreign = hasOneRelations[col].foreign
               const FModel = xansql.getModel(foreign.table)
               const delid = values[columns.indexOf(foreign.relation.target)]
               const d = new DeleteResult(FModel)
               await d.result({
                  where: {
                     [foreign.relation.main]: delid
                  }
               })
            }
            throw new Error(`Insert failed for table: ${model.table}`);
         }

         // create log
         if (model.options.log && xansql.isLogModel(model) === false) {
            await xansql.log?.create({
               data: { model: model.table, action: 'create', rows: [result.insertId] }
            });
         }

         try {
            await this.excuteArraySchema(hasManyRelations, result.insertId)
         } catch (error) {
            const d = new DeleteResult(model)
            await d.result({
               where: {
                  [model.IDColumn]: result.insertId
               }
            })
            throw error
         }

         if (!meta) {
            return [result.insertId]
         }
         return [(result as any).insertId as number]
      }
   }

   private async excuteSchema(items: RelationItems, columns: string[], values: any[]) {
      const xansql = this.model.xansql
      const insertedItems: RelationItems = {}
      for (let rel_col in items) {
         const rel = items[rel_col]
         const foreign = rel.foreign
         const FModel = xansql.getModel(foreign.table)
         const instance = new CreateResult(FModel)
         const res = await instance.result({ data: rel.data }, {
            table: this.model.table,
         })
         if (res.length) {
            columns.push(foreign.relation.target)
            values.push(res[0] || null);
         }
         insertedItems[rel_col] = rel
      }
   }

   private async excuteArraySchema(items: RelationItems, insertId: number) {
      const xansql = this.model.xansql
      const insertedItems: RelationItems = {}
      for (let rel_col in items) {
         const rel = items[rel_col]
         let foreign = rel.foreign
         const FModel = xansql.getModel(foreign.table)
         const instance = new CreateResult(FModel)
         await instance.result({ data: rel.data }, {
            table: this.model.table,
            insertId,
            column: foreign.column
         })
         insertedItems[rel_col] = rel
      }
   }

   private formatData(data: CreateArgs["data"], meta?: MetaInfo) {
      const model = this.model
      const xansql = model.xansql
      const schema = model.schema
      const columns: string[] = []
      const values: any[] = []
      const hasManyRelations: RelationItems = {}
      const hasOneRelations: RelationItems = {}

      for (const column in data) {
         const field = schema[column]
         if (!field) {
            throw new Error(`Column ${column} does not exist in model ${model.table}`);
         }
         let value = (data as any)[column]
         if (field instanceof XqlIDField) {
            throw new Error(`Cannot insert ID field: ${column} in table: ${model.table}`);
         }

         if (xansql.isForeign(field) && typeof value !== "number") {
            const foreign = xansql.foreignInfo(model.table, column) as ForeignInfo
            if (meta && foreign.table === meta.table) {
               throw new Error(`Circular reference detected for relation ${column} in create data. table: ${model.table}`);
            }

            if (xansql.isForeignSchema(schema[column]) && isObject(value)) {
               hasOneRelations[column] = {
                  foreign,
                  data: value
               }
            } else if (xansql.isForeignArray(schema[column]) && isArray(value)) {
               hasManyRelations[column] = {
                  foreign,
                  data: value as any
               }
            } else {
               throw new Error(`Invalid data for relation ${column} in create data. table: ${model.table}`);
            }
         } else {
            if (field instanceof XqlDate) {
               if (field.meta.create) {
                  if (value !== undefined) {
                     throw new Error(`Cannot set create date field: ${column} in table: ${model.table}`);
                  }
                  value = new Date();
               } else if (field.meta.update) {
                  if (value !== undefined) {
                     throw new Error(`Cannot set update date field: ${column} in table: ${model.table}`);
                  }
                  value = new Date();
               }
            }
            columns.push(column)
            values.push(model.toSql(column, value))
         }
      }

      if (meta?.insertId && meta?.column) {
         columns.push(meta.column)
         values.push(meta.insertId)
      }

      this.validateInfo(columns, values)

      return { columns, values, hasManyRelations, hasOneRelations }
   }

   private validateInfo(columns: string[], values: any[]) {
      let model = this.model
      const schema = model.schema
      for (let col in schema) {
         const foreign = model.xansql.isForeign(schema[col])
         if (!columns.includes(col) && col !== model.IDColumn && !foreign) {
            try {
               values.push(model.toSql(col, null));
               columns.push(col);
            } catch (err: any) {
               throw new Error(`${err.message} in table ${model.table}`);
            }
         }
      }
   }

}

export default CreateResult;