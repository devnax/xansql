import Model from "../..";
import { SchemaShape, UpsertArgs } from "../../types";
import BuildCreateArgs from "../CreateArgs";
import BuildUpdateArgs from "../UpdateArgs";

class BuildUpsertArgs {
   constructor(private args: UpsertArgs<SchemaShape>, private model: Model<any>) { }

   async results() {
      const args = this.args
      const model = this.model

      const uargs = new BuildUpdateArgs({
         data: args.update,
         where: args.where
      }, model)

      const results = await uargs.results()
      if (!results?.length) {
         const cargs = new BuildCreateArgs({
            data: args.create,
         }, model)
         return await cargs.results()
      }

      return results
   }
}

export default BuildUpsertArgs