import Model from "../..";
import XansqlError from "../../../core/XansqlError";
import { FindArgs, SelectArgs } from "../../types";

class BuildSelectArgs {

   readonly columns: string[] = []
   readonly relations: { [column: string]: FindArgs<any> } = {}

   get sql() {
      return this.columns.map(c => `${this.model.alias}.${c}`).join(", ")
   }

   constructor(args: SelectArgs, private model: Model<any>) {
      const xansql = model.xansql
      const schema = model.schema()
      const columns: string[] = []
      const relation_one_columns: string[] = []

      for (let col in args) {
         let val = args[col]
         if (!val) continue; // if col: false

         const field = schema[col]
         if (field.isRelation) {
            const isMany = field.type == "relation-many"
            const RModel = xansql.model(field.model)
            const RSchema = RModel.schema()
            const relationInfo = field.relationInfo
            const RArgs: FindArgs<any> = (val === true ? { select: {} } : val) as any
            if (!RArgs.select) {
               RArgs.select = {}
            }

            if (!isMany) {
               relation_one_columns.push(col)
            } else {
               const targetCol = relationInfo.target.column
               const targetFiled = RSchema[targetCol]
               const TModel = xansql.model(targetFiled.model);

               if (TModel.table === model.table && targetCol in RArgs.select) {
                  throw new XansqlError({
                     code: "QUERY_ERROR",
                     message: `Circular reference detected`,
                     model: RModel.table,
                     field: targetCol,
                     params: RArgs
                  })
               }
            }

            this.relations[col] = RArgs as any
         } else {
            columns.push(col)
         }
      }

      if (!columns.length) {
         for (let col in schema) {
            const filed = schema[col]
            if (!filed.isRelation) {
               columns.push(col)
            }
         }
      }

      if (!columns.includes(model.IDColumn)) {
         columns.unshift(model.IDColumn)
      }

      this.columns = [...columns, ...relation_one_columns]
   }
}

export default BuildSelectArgs