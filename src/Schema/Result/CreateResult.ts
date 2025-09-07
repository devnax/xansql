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
         await this.excuteHasOne(hasOneRelations, columns, values)
         let sql = `INSERT INTO ${model.table} (${columns.join(",")}) VALUES (${values.join(",")})`
         console.log(sql);

         const result = await model.xansql.excute(sql, model)
         if (!result.insertId) {
            for (let col in hasOneRelations) {
               const foreign = hasOneRelations[col].foreign
               const FModel = this.model.xansql.getSchema(foreign.table)
               const delid = values[columns.indexOf(foreign.relation.target)]
               let delSql = `DELETE FROM ${FModel.table} WHERE ${foreign.relation.main} = ${delid}`
               await this.model.xansql.excute(delSql, FModel)
            }
            throw new Error(`Insert failed for table: ${model.table}`);
         }
         try {
            await this.excuteHasMany(hasManyRelations, result.insertId)
         } catch (error) {
            //delete hasOne relations
            for (let col in hasOneRelations) {
               const foreign = hasOneRelations[col].foreign
               const FModel = this.model.xansql.getSchema(foreign.table)
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

   private async excuteHasOne(items: RelationItems, columns: string[], values: any[]) {
      const insertedItems: RelationItems = {}
      try {
         for (let rel_col in items) {
            const rel = items[rel_col]
            const foreign = rel.foreign
            const FModel = this.model.xansql.getSchema(foreign.table)
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
            const FModel = this.model.xansql.getSchema(foreign.table)
            const delid = values[columns.indexOf(foreign.relation.target)]
            let delSql = `DELETE FROM ${FModel.table} WHERE ${foreign.relation.main} = ${delid}`
            await this.model.xansql.excute(delSql, FModel)
         }
         throw error
      }
   }

   private async excuteHasMany(items: RelationItems, insertId: number) {

      const insertedItems: RelationItems = {}
      try {
         for (let rel_col in items) {
            const rel = items[rel_col]
            let foreign = rel.foreign
            const FModel = this.model.xansql.getSchema(foreign.table)
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
            const FModel = this.model.xansql.getSchema(foreign.table)
            let delSql = `DELETE FROM ${FModel.table} WHERE ${foreign.relation.main} = ${insertId}`
            await this.model.xansql.excute(delSql, FModel)
         }
         throw error
      }
   }

   private formatData(data: CreateArgs["data"], meta?: MetaInfo) {
      const model = this.model
      const schema = model.schema
      const columns: string[] = []
      const values: any[] = []
      const hasManyRelations: RelationItems = {}
      const hasOneRelations: RelationItems = {}

      for (const column in data) {
         const foreign = model.getForeign(column) as ForeignInfo
         const dataValue = (data as any)[column]

         if (schema[column] instanceof XqlIDField) {
            continue;
         }

         if (foreign) {
            if (meta && foreign.table === meta.table) {
               throw new Error(`Circular reference detected for relation ${column} in create data. table: ${model.table}`);
            }

            if (foreign.type === "hasOne" && dataValue && typeof dataValue === 'object' && !Array.isArray(dataValue)) {
               hasOneRelations[column] = {
                  foreign,
                  data: dataValue
               }
            } else if (foreign.type === "hasMany" && Array.isArray(dataValue) || typeof dataValue === 'object') {
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
         const foreign = model.getForeign(col) as ForeignInfo
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