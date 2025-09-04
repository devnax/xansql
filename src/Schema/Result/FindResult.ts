import Schema from "..";
import { ForeignInfo } from "../../type";
import { isNumber, isObject } from "../../utils";
import BuildLimit from "../Query/BuildLimit";
import BuildOrderby from "../Query/BuildOrderby";
import BuildSelect, { BuildSelectJoinInfo } from "../Query/BuildSelect";
import BuildWhere from "../Query/BuildWhere";
import { FindArgs } from "../type";
import WhereArgs from "./WhereArgs";

class FindResult {
   private model: Schema
   constructor(model: Schema) {
      this.model = model
   }

   async result(args: FindArgs) {
      const res = await this.excute(args)
      return res
   }

   private async excute(args: FindArgs) {
      const model = this.model
      const { select, where, limit, orderBy } = args
      const columns: string[] = []

      let relationArgs: { [column: string]: { args: FindArgs, foreign: ForeignInfo } } = {}

      for (let column in select) {
         const xanv = model.schema[column]
         const foreign = model.getForeign(column)
         if (!xanv && !foreign) {
            throw new Error("Invalid column in select clause: " + column)
         };

         const value: any = select[column]

         if (foreign) {
            if (!columns.includes(`${model.table}.${foreign.relation.target}`)) {
               columns.push(`${model.table}.${foreign.relation.target}`)
            }

            const fargs = {
               select: isObject(value) ? value.select : {},
               where: isObject(value) && value.where ? value.where : {},
               limit: isObject(value) && value.limit ? value.limit : {},
               orderBy: isObject(value) && value.orderBy ? value.orderBy : {},
            }

            relationArgs[column] = {
               args: fargs,
               foreign
            }

         } else {
            if (value === true) {
               columns.push(`${model.table}.${column}`)
            } else if (value === false) {
               continue
            } else {
               throw new Error("Invalid select value for column " + column)
            }
         }
      }

      console.log(model.table, where);


      const Where = new WhereArgs(model, where || {})
      let sql = `SELECT ${columns.length ? columns.join(", ") : "*"} FROM ${model.table}`
      // if (Where.is) {
      //    sql += ` WHERE ${Where.wheres.join(" AND ")}`
      // }


      const { result } = await model.excute(sql)
      if (result.length) {
         for (let rel_args in relationArgs) {
            const { args, foreign } = relationArgs[rel_args]
            const FModel = model.xansql.getSchema(foreign.table)
            let ids: number[] = result.map((r: any) => r[foreign.relation.target]);
            (args.where as any)[foreign.relation.main] = {
               in: Array.from(new Set(ids.filter(id => isNumber(id))))
            }
            const findResult = new FindResult(FModel)
            const frelation = await findResult.result(args)

         }
      }

      return result

   }
}

export default FindResult;