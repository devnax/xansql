import Schema from "..";
import { ForeignInfo } from "../../type";
import XqlIDField from "../../Types/fields/IDField";
import { CreateArgs } from "../type";
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

   async result(args: CreateArgs) {
      let ids = await this.excute(args)
      if (ids.length) {
         const findArgs = {
            where: {
               [this.model.IDColumn]: {
                  in: ids
               }
            },
            select: args.select || {}
         }

         return await this.finder.result(findArgs)
      }

      throw new Error("Create failed, no records created.");
   }

   async excute(args: CreateArgs, meta?: MetaInfo) {
      const model = this.model
      const data = args.data

      if (Array.isArray(data)) {
         let ids: number[] = []
         for (let item of data) {
            let insertId = await this.excute({ data: item }, meta)
            if (insertId) ids.push(insertId)
         }
         return ids
      } else {
         const { columns, values, hasManyRelations, hasOneRelations } = this.formatData(data, meta)
         await this.excuteSchema(hasOneRelations, columns, values)
         let sql = `INSERT INTO ${model.table} (${columns.join(",")}) VALUES (${values.join(",")})`
         const result = await model.xansql.excute(sql, model)
         if (!result.insertId) {
            for (let col in hasOneRelations) {
               const foreign = hasOneRelations[col].foreign
               const FModel = this.model.xansql.getModel(foreign.table)
               const delid = values[columns.indexOf(foreign.relation.target)]
               let delSql = `DELETE FROM ${FModel.table} WHERE ${foreign.relation.main} = ${delid}`
               await this.model.xansql.excute(delSql, FModel)
            }
            throw new Error(`Insert failed for table: ${model.table}`);
         }


         try {
            await this.excuteArraySchema(hasManyRelations, result.insertId)
         } catch (error) {
            for (let col in hasOneRelations) {
               const foreign = hasOneRelations[col].foreign
               const FModel = this.model.xansql.getModel(foreign.table)
               const delid = values[columns.indexOf(foreign.relation.target)]
               let delSql = `DELETE FROM ${FModel.table} WHERE ${foreign.relation.main} = ${delid}`
               await this.model.xansql.excute(delSql, FModel)
            }

            //delete main record
            let delSql = `DELETE FROM ${model.table} WHERE ${model.IDColumn} = ${result.insertId}`
            await this.model.xansql.excute(delSql, model)

            throw error
         }

         if (!meta) {
            return [result.insertId]
         }
         return result.insertId || null
      }
   }

   private async excuteSchema(items: RelationItems, columns: string[], values: any[]) {
      const insertedItems: RelationItems = {}
      try {
         for (let rel_col in items) {
            const rel = items[rel_col]
            const foreign = rel.foreign
            const FModel = this.model.xansql.getModel(foreign.table)
            const instance = new CreateResult(FModel)
            const insertId = await instance.excute({ data: rel.data }, {
               table: this.model.table,
            })
            if (insertId) {
               columns.push(foreign.relation.target)
               values.push(insertId || null);
            }
            insertedItems[rel_col] = rel
         }
      } catch (error) {
         for (let col in insertedItems) {
            const foreign = insertedItems[col].foreign
            const FModel = this.model.xansql.getModel(foreign.table)
            const delid = values[columns.indexOf(foreign.relation.target)]
            let delSql = `DELETE FROM ${FModel.table} WHERE ${foreign.relation.main} = ${delid}`
            await this.model.xansql.excute(delSql, FModel)
         }
         throw error
      }
   }

   private async excuteArraySchema(items: RelationItems, insertId: number) {

      const insertedItems: RelationItems = {}
      try {
         for (let rel_col in items) {
            const rel = items[rel_col]
            let foreign = rel.foreign
            const FModel = this.model.xansql.getModel(foreign.table)
            const instance = new CreateResult(FModel)
            await instance.excute({ data: rel.data }, {
               table: this.model.table,
               insertId,
               column: foreign.column
            })
            insertedItems[rel_col] = rel
         }
      } catch (error) {
         for (let col in insertedItems) {
            const foreign = insertedItems[col].foreign
            const FModel = this.model.xansql.getModel(foreign.table)
            let delSql = `DELETE FROM ${FModel.table} WHERE ${foreign.relation.main} = ${insertId}`
            await this.model.xansql.excute(delSql, FModel)
         }
         throw error
      }
   }

   private formatData(data: CreateArgs["data"], meta?: MetaInfo) {
      const model = this.model
      const xansql = this.model.xansql
      const schema = model.schema
      const columns: string[] = []
      const values: any[] = []
      const hasManyRelations: RelationItems = {}
      const hasOneRelations: RelationItems = {}

      for (const column in data) {
         const dataValue = (data as any)[column]

         if (schema[column] instanceof XqlIDField) {
            throw new Error(`Cannot insert ID field: ${column} in table: ${model.table}`);
         }

         if (xansql.isForeign(schema[column])) {
            const foreign = xansql.foreignInfo(model.table, column) as ForeignInfo
            if (meta && foreign.table === meta.table) {
               throw new Error(`Circular reference detected for relation ${column} in create data. table: ${model.table}`);
            }

            if (xansql.isForeignSchema(schema[column]) && dataValue && typeof dataValue === 'object' && !Array.isArray(dataValue)) {
               hasOneRelations[column] = {
                  foreign,
                  data: dataValue
               }
            } else if (xansql.isForeignArray(schema[column]) && Array.isArray(dataValue) || typeof dataValue === 'object') {
               hasManyRelations[column] = {
                  foreign,
                  data: dataValue
               }
            } else {
               throw new Error(`Invalid data for relation ${column} in create data. table: ${model.table}`);
            }
         } else {
            columns.push(column)
            values.push(model.toSql(column, dataValue))
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
            } catch (err) {
               throw new Error(`Field ${col} is required in create data. table: ${model.table}`);
            }
         }
      }
   }

}

export default CreateResult;