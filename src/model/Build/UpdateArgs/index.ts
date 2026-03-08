import Model from "../..";
import { XansqlFileMeta } from "../../../core/types";
import XansqlError from "../../../core/XansqlError";
import { iof, isNumber, isObject, quote } from "../../../utils";
import XqlDate from "../../../xt/fields/Date";
import XqlFile from "../../../xt/fields/File";
import { SchemaShape, SelectArgs, UpdateArgs } from "../../types";
import BuildFindArgs from "../FindArgs";
import BuildWhereArgs from "../WhereArgs";

class BuildUpdateArgs {

   constructor(private args: UpdateArgs<SchemaShape>, private model: Model<any>, private isSubquery = false) {
      this.validateData(args.data)
   }

   async results() {
      const model = this.model
      const xansql = this.model.xansql
      const args = this.args
      const isSubquery = this.isSubquery
      const schema = model.schema()
      const data = args.data

      const wargs = new BuildWhereArgs(args.where, model)
      const values: string[] = []
      const relations: { [col: string]: UpdateArgs<any>['data'] } = {}
      const fileMetas: { [col: string]: XansqlFileMeta } = {}

      for (let col in data) {
         const value = data[col]
         const field = schema[col]
         if (field.isRelation) {
            if (field.type === "relation-one") {
               values.push(`${quote(xansql.dialect.engine, col)}=${value}`)
            } else {
               relations[col] = value
            }
         } else {
            if (iof(field, XqlFile)) {
               try {
                  const filemeta = await xansql.uploadFile(value) as any
                  (fileMetas as any)[col] = filemeta
                  values.push(`${quote(xansql.dialect.engine, col)}='${JSON.stringify(filemeta)}'`)
               } catch (error: any) {
                  throw new XansqlError({
                     code: "FILE_ERROR",
                     message: error.message,
                     model: model.table,
                     field: col
                  })
               }
            } else {
               try {
                  values.push(`${quote(xansql.dialect.engine, col)}=${field.value.toSql(value)}`)
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

      // set updatedAt and update
      for (let col in schema) {
         const field = schema[col]
         if (iof(field, XqlDate) && field.meta.updatedAt) {
            const v = field.value.toSql(new Date())
            values.push(`${quote(xansql.dialect.engine, col)}=${v}`)
         }
      }

      // taking old filemetas
      let oldFileResults
      if (Object.keys(fileMetas).length) {
         let select: any = {}
         for (let col in fileMetas) {
            select[col] = true
         }
         const build = new BuildFindArgs({
            select,
            where: args.where,
            debug: false
         }, model)
         oldFileResults = await build.results()
      }

      let execute
      try {
         let sql = `UPDATE ${model.table} as ${model.alias} SET ${values.join(", ")} ${wargs.sql}`.trim()
         execute = await model.execute(sql.replace(/\s+/gi, " "), args.debug)
      } catch (error) {
         for (let col in fileMetas) {
            await xansql.deleteFile(fileMetas[col].fileId)
         }
         throw error
      }

      if (execute?.affectedRows && Object.keys(relations).length) {

         // delete Old files
         if (oldFileResults) {
            for (let row of oldFileResults) {
               for (let col in fileMetas) {
                  const meta = row[col]
                  if (meta) {
                     await xansql.deleteFile(meta.fileId)
                  }
               }
            }
         }

         for (let col in relations) {
            const rargs = relations[col] as UpdateArgs<any>
            const field = schema[col]
            const rinfo = field.relationInfo
            const RModel = xansql.model(field.model)

            const build = new BuildUpdateArgs({
               ...rargs,
               where: {
                  ...rargs.where,
                  [rinfo.target.column]: args.where
               },
               debug: args.debug
            }, RModel, true)
            await build.results()
         }
      }

      if (!isSubquery && execute?.affectedRows) {
         let sargs: SelectArgs = this.makeSelectArgs(data, model)
         const buildFind = new BuildFindArgs({
            select: sargs,
            where: {
               ...args.where,
            },
            debug: args.debug
         }, model)
         return await buildFind.results()
      }
   }

   private makeSelectArgs(data: UpdateArgs<any>['data'], model: Model<any>) {
      let args: any = {}
      const schema = model.schema()
      const xansql = model.xansql

      for (let col in data) {
         const field = schema[col] as any
         if (field.type === "relation-many") {
            const RModel = xansql.model(field.model)
            const sub_args = data[col] as UpdateArgs<any>
            const childargs = this.makeSelectArgs(sub_args.data as any, RModel)
            if (Object.keys(childargs).length) {
               args[col] = {
                  select: childargs,
                  where: sub_args.where
               }
            } else {
               args[col] = {
                  where: sub_args.where
               }
            }
         } else {
            args[col] = true
         }
      }

      return args
   }

   private validateData(data: UpdateArgs<any>['data']) {
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

         if (field.type === "relation-one" && !(isNumber(value) || value === null)) {
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

export default BuildUpdateArgs