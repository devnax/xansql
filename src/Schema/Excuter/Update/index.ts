import Schema from "../.."
import { isArray } from "../../../utils"
import WhereArgs from "../../Args/WhereArgs"
import { UpdateArgsType } from "../../type"
import SelectArgs from "../Find/SelectArgs"
import UpdateDataArgs from "./UpdateDataArgs"


class UpdateExcuter {
   model: Schema
   constructor(model: Schema) {
      this.model = model
   }

   async excute(args: UpdateArgsType) {
      const xansql = this.model.xansql
      const model = this.model
      const UpdateArgs = new UpdateDataArgs(model, args.data)

      if (Object.keys(args.where).length === 0) {
         throw new Error(`Where args is required for update operation in model ${model.table}`)
      }

      const Where = new WhereArgs(model, args.where)
      let sql = `UPDATE ${model.table} SET ${UpdateArgs.sql} ${Where.sql}`.trim()
      const update = await model.excute(sql)
      if (!update.affectedRows) {
         return []
      }

      const updated_rows = await model.find({
         where: args.where,
         select: {
            [model.IDColumn]: true
         }
      })

      const ids = []
      for (let urow of updated_rows) {
         ids.push(urow[model.IDColumn])
      }

      for (let column in UpdateArgs.relations) {
         const relation = UpdateArgs.relations[column]
         const foreign = relation.foreign
         const FModel = xansql.getModel(foreign.table)
         const relArgs = relation.args

         // handle delete
         if (relArgs.delete) {
            await FModel.delete({
               where: {
                  ...relArgs.delete.where,
                  [foreign.column]: {
                     in: ids
                  }
               }
            })
         }

         // handle update
         if (relArgs.update) {
            await FModel.update({
               data: relArgs.update.data,
               where: {
                  ...relArgs.update.where,
                  [foreign.column]: {
                     in: ids
                  }
               }
            })
         }
         // handle create
         if (relArgs.create) {
            for (let id of ids) {
               if (isArray(relArgs.create.data)) {
                  for (let item of relArgs.create.data) {
                     await FModel.create({
                        data: {
                           ...item,
                           [foreign.column]: id
                        }
                     })
                  }
               } else {
                  await FModel.create({
                     data: {
                        ...relArgs.create.data,
                        [foreign.column]: id
                     }
                  })
               }
            }
         }

         // handle upsert
         if (relArgs.upsert) {
            const has = await FModel.count({
               where: {
                  ...relArgs.upsert.where,
                  [foreign.column]: {
                     in: ids
                  }
               },
            })
            if (has) {
               await FModel.update({
                  data: relArgs.upsert.update,
                  where: {
                     ...relArgs.upsert.where,
                     [foreign.column]: {
                        in: ids
                     }
                  }
               })
            } else {
               for (let id of ids) {
                  await FModel.create({
                     data: {
                        ...relArgs.upsert.create,
                        [foreign.column]: id
                     }
                  })
               }
            }
         }
      }

      if (args.select) {
         return await model.find({
            where: {
               [model.IDColumn]: {
                  in: ids
               }
            },
            select: args.select
         })
      }

      return updated_rows
   }

}

export default UpdateExcuter