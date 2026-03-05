import { XVType } from "xanv"
import Model from "../../model"
import { XansqlDialectEngine } from "../../core/types"
import XqlFieldInfo from "../XqlFieldInfo"
import { ModelClass } from "../../model/types"

export type RelationManyInfo = {
   self: {
      table: string
      column: string,
      relation: string,
   }
   target: {
      table: string
      column: string
      relation: string
   },
   sql: string // self table join target table on self.column = target.column
}

class XqlRelationMany<M extends Model, T extends string = string> extends XVType<any> {
   readonly schema!: ReturnType<M['schema']>
   readonly model: ModelClass<M>
   readonly type = "relation-many"
   readonly isRelation = true
   readonly targetColumn: T

   table!: string
   column_name!: string
   engine!: XansqlDialectEngine

   get info(): XqlFieldInfo {
      return new XqlFieldInfo(this)
   }

   relationInfo: RelationManyInfo = {
      self: {
         table: '',
         column: '',
         relation: '',
      },
      target: {
         table: '',
         column: '',
         relation: '',
      },
      sql: ''
   }

   protected check(value: unknown) { }

   constructor(model: ModelClass<M>, targetColumn: T) {
      super()
      this.model = model
      this.targetColumn = targetColumn
   }

   optional(): any {
      throw new Error("optional not supported");
   }

   nullable(): any {
      throw new Error("nullable not supported");
   }
}
export default XqlRelationMany
