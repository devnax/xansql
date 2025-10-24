import Schema from "../..";
import Foreign from "../../include/Foreign";
import { FindArgsAggregate } from "../../type";


class AggregateArgs {

   model: Schema
   constructor(model: Schema, args: FindArgsAggregate) {
      this.model = model
      const xansql = model.xansql
      let aggResults: any = []
      if (args && Object.keys(args).length) {
         for (let col in args) {
            if (!(col in model.schema)) {
               throw new Error(`Invalid column in aggregate clause: ${col} in model ${model.table}`)
            }
            const foreign = Foreign.info(model, col)
            if (!foreign) {
               throw new Error(`Column ${col} is not a foreign column in ${model.table}, cannot aggregate on it.`)
            }
            if (!Foreign.isArray(model.schema[col])) {
               throw new Error(`Column ${col} is not a foreign array column in ${model.table}, cannot aggregate on it.`)
            }

            const FModel = xansql.getModel(foreign.table)
            let ids: number[] = []
            for (let r of result) {
               let id = r[foreign.relation.target]
               if (typeof id === "number" && !ids.includes(id)) {
                  ids.push(id)
               }
            }
            if (ids.length === 0) continue;
            const aggregateResult = new AggregateResult(FModel)
            const aggRes = await aggregateResult.result({
               where: {
                  [foreign.relation.main]: {
                     in: ids
                  }
               },
               groupBy: [foreign.relation.main],
               aggregate: aggregate[col]
            })
            aggResults.push({ col, foreign, aggRes })
         }
      }
      return aggResults

   }
}

export default AggregateArgs;