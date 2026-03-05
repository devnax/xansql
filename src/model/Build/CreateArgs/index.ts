import Model from "../..";
import { XansqlFileMeta } from "../../../core/types";
import XansqlError from "../../../core/XansqlError";
import { deepMerge, iof, isNumber, isObject, quote } from "../../../utils";
import XqlDate from "../../../xt/fields/Date";
import XqlFile from "../../../xt/fields/File";
import XqlIDField from "../../../xt/fields/IDField";
import { CreateArgs, SchemaShape, SelectArgs } from "../../types";
import BuildFindArgs from "../FindArgs";

class BuildCreateArgs {
   private isSubquery
   constructor(private args: CreateArgs<SchemaShape>, private model: Model<any>, isSubquery = false) {
      this.isSubquery = isSubquery
      const data = args.data
      if (Array.isArray(data)) {
         for (let d of data) {
            this.validateData(d)
         }
      } else {
         this.validateData(data)
      }
   }

   async results() {
      const model = this.model
      const xansql = this.model.xansql
      const args = this.args
      const isSubquery = this.isSubquery
      const schema = model.schema()
      const data = args.data

      if (Array.isArray(data)) {
         for (let d of data) {
            const build = new BuildCreateArgs({ data: d }, model, isSubquery)
            await build.results()
         }
      } else {
         const values: { [col: string]: any } = {}
         const relations: { [col: string]: CreateArgs<any>['data'] } = {}
         const fileMetas: { [col: string]: XansqlFileMeta } = {}

         // set create and update
         for (let col in schema) {
            const field = schema[col]

            if (iof(field, XqlIDField)) {
               continue
            }
            if (iof(field, XqlDate) && (field.meta.createdAt || field.meta.updatedAt)) {
               const v = field.value.toSql(new Date())
               values[quote(xansql.dialect.engine, col)] = v
               continue
            }

            if (col in data) {
               const value = data[col]
               if (field.isRelation) {
                  if (field.type === "relation-one") {
                     values[quote(xansql.dialect.engine, col)] = value
                  } else {
                     relations[col] = value
                  }
               } else {
                  if (iof(field, XqlFile)) {
                     try {
                        const filemeta = await xansql.uploadFile(value);
                        if (!filemeta) {
                           throw new XansqlError({
                              code: "VALIDATION_ERROR",
                              message: `Failed to upload file for field "${col}" in table "${model.table}".`,
                              model: model.table,
                              field: col
                           })
                        };
                        (fileMetas as any)[col] = filemeta
                        values[quote(xansql.dialect.engine, col)] = `'${JSON.stringify(filemeta)}'`
                     } catch (error: any) {
                        throw error
                     }
                  } else {
                     try {
                        values[quote(xansql.dialect.engine, col)] = field.value.toSql(value)
                     } catch (error: any) {
                        throw new XansqlError({
                           code: "VALIDATION_ERROR",
                           message: error.message,
                           model: model.table,
                           field: col
                        })
                     }
                  }
               }
            } else {
               if (field.isRelation) {
                  if (field.type === "relation-one" && !field.meta.nullable) {
                     throw new XansqlError({
                        code: "VALIDATION_ERROR",
                        message: `Field "${col}" in table "${model.table}" is a non-nullable relation-one field and cannot be left empty.`,
                        model: model.table,
                        field: col,
                     });
                  }
               } else {
                  try {
                     values[quote(xansql.dialect.engine, col)] = field.value.toSql(undefined)
                  } catch (error: any) {
                     throw new XansqlError({
                        code: "VALIDATION_ERROR",
                        message: error.message,
                        model: model.table,
                        field: col
                     })
                  }
               }
            }
         }

         let insertId
         try {
            const engine = xansql.dialect.engine
            let sql = `INSERT INTO ${model.table} (${Object.keys(values).join(', ')}) VALUES (${Object.values(values).join(", ")})`
            if (engine === "postgres") sql += ` RETURNING ${model.IDColumn}`
            sql = sql.replace(/\s+/gi, " ")
            const results = await model.execute(sql)
            insertId = results?.insertId
            if (results.results?.length && engine === "postgres") {
               insertId = results.results[0][model.IDColumn]
            }
         } catch (error) {
            for (let col in fileMetas) {
               await xansql.deleteFile(fileMetas[col].fileId)
            }
            throw error
         }

         if (insertId && Object.keys(relations).length) {
            for (let col in relations) {
               const rdata = relations[col]
               const field = schema[col]
               const rinfo = field.relationInfo
               const RModel = xansql.model(field.model)
               if (Array.isArray(rdata)) {
                  for (let d of rdata) {
                     d[rinfo.target.relation] = insertId
                  }
               } else {
                  rdata[rinfo.target.relation] = insertId
               }

               const build = new BuildCreateArgs({ data: rdata }, RModel, true)
               await build.results()
            }
         }

         if (!isSubquery && insertId) {
            let sargs: SelectArgs = !args.select ? this.makeSelectArgs(data, model) : args.select
            const buildFind = new BuildFindArgs({
               select: sargs,
               where: {
                  [model.IDColumn]: insertId
               }
            }, model)
            return await buildFind.results()
         }
      }
   }

   private makeSelectArgs(data: CreateArgs<any>['data'], model: Model<any>) {
      let args: any = {}
      const schema = model.schema()
      const xansql = model.xansql

      if (Array.isArray(data)) {
         for (let d of data) {
            const a = this.makeSelectArgs(d, model)
            args = deepMerge(args, a)
         }
      } else {
         for (let col in data) {
            const field = schema[col] as any
            if (field.type === "relation-many") {
               const RModel = xansql.model(field.model)
               const childargs = this.makeSelectArgs(data[col] as any, RModel)
               if (Object.keys(childargs).length) {
                  args[col] = {
                     select: childargs
                  }
               } else {
                  args[col] = true
               }
            }
         }
      }

      return args
   }

   private validateData(data: any) {
      const model = this.model
      const schema = model.schema()

      if (!isObject(data)) {
         throw new XansqlError({
            code: "VALIDATION_ERROR",
            message: `Expected "data" to be an object, received ${typeof data}`,
            model: model.table,
            params: data
         })
      }

      // check if idColumn exists
      if (model.IDColumn in data) {
         throw new XansqlError({
            code: "VALIDATION_ERROR",
            message: `You cannot set a value for the primary key "${model.IDColumn}" in table "${model.table}".`,
            model: model.table,
            field: model.IDColumn,
         })
      }

      for (let col in data) {
         const value = data[col]
         const field = schema[col]

         if (field.meta.create || field.meta.update) {
            if (col in data) {
               throw new XansqlError({
                  code: "VALIDATION_ERROR",
                  message: `Cannot set a value for "${col}" in table "${model.table}" — this field is automatically managed.`,
                  model: model.table,
                  field: col,
               })
            }
         }

         if (field.type === "relation-one" && !isNumber(value)) {
            throw new XansqlError({
               code: "VALIDATION_ERROR",
               message: `Invalid value for foreign key "${col}" in table "${model.table}". Expected a number, got ${typeof value}.`,
               model: model.table,
               field: col,
            })
         }

         if (iof(field, XqlFile) && !iof(value, File)) {
            throw new XansqlError({
               code: "VALIDATION_ERROR",
               message: `Invalid value for "${col}" in table "${model.table}". Expected a File, received ${typeof value}.`,
               model: model.table,
               field: col
            })
         }
      }
   }
}

export default BuildCreateArgs