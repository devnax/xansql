import { xv } from "xanv";
import Model from "../model";
import xt from "../xt";
import Xansql from "./Xansql";
import { XqlFieldInfoSchema } from "../xt/XqlFieldInfo";
import XqlRelationMany from "../xt/fields/RelationMany";
import { iof } from "../utils";
import XansqlError from "./XansqlError";

class MigrationModel extends Model {
   get table() {
      return "_xansql_migration"
   }

   schema() {
      return {
         id: xt.id(),
         model: xt.string(),
         schema: xt.record(xt.string(), xt.object({
            type: xt.string(),
            length: xt.number().nullable(),
            default: xv.any(),
            unique: xt.boolean(),
            nullable: xt.boolean(),
            index: xt.string()
         })),
         created_at: xt.date().createdAt(),
         updated_at: xt.date().updatedAt(),
      }
   }
}


class Migration {
   model
   constructor(private xansql: Xansql) {
      this.model = xansql.model(MigrationModel)
      this.migrate(this.model)
   }

   async migrate<M extends Model<any>>(model: M) {
      if (typeof window !== "undefined") return

      const schema = model.schema()
      let column_sqls = []
      let index_sqls = []
      let migrate_schema: { [column: string]: XqlFieldInfoSchema } = {}

      for (let column in schema) {
         const field = schema[column]
         if (!iof(field, XqlRelationMany)) {
            const info = field.info
            column_sqls.push(info.sql.column)
            if (info.sql.create_index) {
               index_sqls.push(info.sql.create_index)
            }
            migrate_schema[column] = field.info.schema
         }
      }

      const sql = `CREATE TABLE IF NOT EXISTS ${model.table}(${column_sqls.join(",")})`
      await model.execute(sql, false)
      for (let idxql of index_sqls) {
         try {
            await model.execute(idxql, false)
         } catch (error) { }
      }

      if (model.table === this.model.table) {
         return
      }

      const prev_migration = await this.migrateSchema(model)
      if (prev_migration) {
         for (let column in schema) {
            const field = schema[column]
            if (!iof(field, XqlRelationMany)) {
               const info = field.info
               if (column in prev_migration) {

               } else {
                  // Add column
                  await model.execute(info.sql.alter_column, false)
               }
            }
         }
      }

      return await this.model.upsert({
         create: {
            model: model.table,
            schema: migrate_schema
         },
         update: {
            schema: migrate_schema
         },
         where: {
            model: model.table
         },
         useTransection: false,
         debug: false
      })
   }

   async get(model: Model) {
      return await this.model.findOne({
         where: {
            model: model.table
         },
         debug: false
      })
   }

   async migrateSchema(model: Model) {
      const get = await this.get(model)
      if (get) {
         return get.schema
      }
   }

   async has(model: Model) {
      return await this.model.count({
         model: model.table,
      })
   }
}

export default Migration