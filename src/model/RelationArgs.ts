import { GetRelationType } from "./type"

class RelationArgs {
   args: any
   relation: GetRelationType | null = null

   constructor(args: any, relation?: GetRelationType) {
      this.args = args
      this.relation = relation || null
   }
}

export default RelationArgs;