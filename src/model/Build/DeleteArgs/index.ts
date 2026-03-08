import Model from "../..";
import { XansqlFileMeta } from "../../../core/types";
import { iof } from "../../../utils";
import { chunkArray } from "../../../utils/chunker";
import XqlFile from "../../../xt/fields/File";
import { DeleteArgs, SchemaShape } from "../../types";
import BuildFindArgs from "../FindArgs";
import BuildSelectArgs from "../SelectArgs";
import BuildUpdateArgs from "../UpdateArgs";
import BuildWhereArgs from "../WhereArgs";

class BuildDeleteArgs {
   constructor(private args: DeleteArgs<SchemaShape>, private model: Model<SchemaShape>, private isSubquery = false) {

   }

   async results() {
      const model = this.model
      const args = this.args
      const isSubquery = this.isSubquery
      const schema = model.schema()
      const xansql = model.xansql
      const models = xansql.models

      for (let m of Array.from(models.values())) {
         const mschema = m.schema()
         for (let col in mschema) {
            const field = mschema[col] as any

            if (field.type === "relation-one" && field.model == model.constructor) {
               const isNullable = field.meta.nullable
               const isSameModel = m.table === model.table

               let ids: number[] = []
               if (isSameModel) {
                  const fargs = new BuildFindArgs({
                     select: {
                        [m.IDColumn]: true,
                        [col]: {
                           select: {
                              [m.IDColumn]: true,
                           }
                        }
                     },
                     where: args.where,
                     debug: false
                  }, m)
                  const res = await fargs.results()
                  if (res?.length) {
                     for (let r of res) {
                        if (r[col] && r[col][m.IDColumn]) {
                           ids.push(r[col][m.IDColumn])
                        }
                     }
                  }
               }
               if (isNullable) {
                  if (isSameModel) {
                     if (ids?.length) {
                        for (let { chunk } of chunkArray(ids)) {
                           const build = new BuildUpdateArgs({
                              data: {
                                 [col]: null
                              },
                              where: {
                                 [model.IDColumn]: {
                                    in: chunk
                                 }
                              },
                              debug: args.debug
                           }, m)
                           await build.results()
                        }
                     }
                  } else {
                     const build = new BuildUpdateArgs({
                        data: {
                           [col]: null
                        },
                        where: {
                           [col]: args.where
                        },
                        debug: args.debug
                     }, m)
                     await build.results()
                  }
               } else {
                  if (isSameModel) {
                     if (ids.length) {
                        for (let { chunk } of chunkArray(ids)) {
                           const build = new BuildDeleteArgs({
                              where: {
                                 [model.IDColumn]: {
                                    in: chunk
                                 }
                              },
                              debug: args.debug
                           }, m, true)

                           await build.results()
                        }
                     }
                  } else {
                     const build = new BuildDeleteArgs({
                        where: {
                           [col]: args.where
                        },
                        debug: args.debug
                     }, m, true)
                     await build.results()
                  }
               }
            }
         }
      }


      const wargs = new BuildWhereArgs(args.where, model)
      const _select: any = {}
      for (let col in schema) {
         const field = schema[col] as any
         if (iof(field, XqlFile)) {
            _select[col] = true
         }
      }

      const fargs = new BuildFindArgs({
         select: {
            [model.IDColumn]: true,
            ..._select
         },
         where: args.where,
         debug: false
      }, model)
      const fileRows = await fargs.results()

      let results
      if (!isSubquery) {
         const build = new BuildFindArgs(args, model)
         results = await build.results()
      }

      const sql = `DELETE FROM ${model.table} as ${model.alias} ${wargs.sql}`.trim()
      const execute = await model.execute(sql, args.debug)

      if (execute.affectedRows && fileRows?.length) {
         for (let { chunk } of chunkArray(fileRows)) {
            for (let frow of chunk) {
               for (let col in frow) {
                  const field = schema[col]
                  if (iof(field, XqlFile)) {
                     const fileMeta = frow[col]
                     if (fileMeta) {
                        await xansql.deleteFile(fileMeta.fileId)
                     }
                  }
               }
            }
         }
      }

      return results
   }
}

export default BuildDeleteArgs