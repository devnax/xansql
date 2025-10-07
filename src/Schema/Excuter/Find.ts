import Schema from "..";
import LimitArgs from "../Args/LimitArgs";
import OrderByArgs from "../Args/OrderByArgs";
import SelectArgs from "../Args/SelectArgs";
import WhereArgs from "../Args/WhereArgs";
import Foreign from "../include/Foreign";
import { FindArgsType } from "../type";

class FindExcuter {
   model: Schema
   constructor(model: Schema) {
      this.model = model
   }

   async excute(args: FindArgsType) {
      const model = this.model
      const Select = new SelectArgs(model, args.select || {})
      const Where = new WhereArgs(model, args.where || {})
      const Limit = new LimitArgs(model, args.limit || {})
      const OrderBy = new OrderByArgs(model, args.orderBy || {})
      const sql = `SELECT ${Select.sql} FROM ${model.table} ${Where.sql}${OrderBy.sql}${Limit.sql}`.trim()
      const { result } = await model.excute(sql)

      if (Select.relations && Object.keys(Select.relations).length) {
         for (let column in Select.relations) {
            let relation = Select.relations[column]
            let foreign = relation.foreign
            let fargs = relation.args
            let FModel = model.xansql.getModel(foreign.table)
            let ids = result.map((r: any) => r[foreign.relation.target])
            const fres = await FModel.find({
               orderBy: fargs.orderBy || {},
               limit: fargs.limit || {},
               select: {
                  ...fargs.select,
                  [foreign.relation.main]: true
               },
               where: {
                  ...fargs.where,
                  [foreign.relation.main]: {
                     in: ids
                  }
               }
            })

            for (let r of result) {
               if (Foreign.isArray(this.model.schema[column])) {
                  r[column] = fres.filter((fr: any) => {
                     let is = fr[foreign.relation.main] === r[foreign.relation.target]
                     if (is) delete fr[foreign.relation.main]
                     return is
                  })

               } else {
                  r[column] = fres.find((fr: any) => fr[foreign.relation.main] === r[foreign.relation.target]) || null
               }
            }
         }
      }
      return result;
   }

}

export default FindExcuter;