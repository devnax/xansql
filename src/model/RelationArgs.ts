import { GetRelationType } from "./type"

class RelationArgs {
   args: any
   relation: GetRelationType | null = null
   parent_ids: number[] = []

   constructor(args: any, parent_ids?: number[], relation?: GetRelationType) {
      this.args = args
      this.relation = relation || null
      this.parent_ids = parent_ids || []
   }
}

export default RelationArgs;