import { GetRelationType } from "./type"

class RelationArgs {
   args: any
   relation: GetRelationType | null = null
   IN: number[] = []

   constructor(args: any, IN?: number[], relation?: GetRelationType) {
      this.args = args
      this.relation = relation || null
      this.IN = IN || []
   }
}

export default RelationArgs;