import { GetRelationType } from "./type"

class RelationArgs {
   args: any
   parent_sql: string | null = null
   relation: GetRelationType | null = null

   constructor(args: any, parent_sql?: string, relation?: GetRelationType) {
      this.args = args
      this.parent_sql = parent_sql || null
      this.relation = relation || null
   }
}

export default RelationArgs;