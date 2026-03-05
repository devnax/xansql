import { XVType } from "xanv"
import Model from "../../model"
import { XansqlDialectEngine } from "../../core/types"
import XqlFieldInfo from "../XqlFieldInfo"
import { ModelClass } from "../../model/types"


export type RelationOneInfo = {
   self: {
      table: string
      column: string
      relation: string
   }
   target: {
      table: string
      column: string
      relation: string
   },
   sql: string // self table join target table on self.column = target.column
}


class XqlRelationOne<M extends Model, T extends string = string> extends XVType<any> {
   readonly schema!: ReturnType<M['schema']>
   readonly model: ModelClass<M>
   readonly type = "relation-one"
   readonly isRelation = true
   readonly targetColumn: T

   table!: string
   column_name!: string
   engine!: XansqlDialectEngine

   get info(): XqlFieldInfo {
      return new XqlFieldInfo(this)
   }

   relationInfo: RelationOneInfo = {
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

   readonly value = {
      toSql: (value: unknown): string => {
         value = super.parse(value) as any
         if (value === undefined || value === null) return 'NULL';
         return `${value}`
      },
      fromSql: (value: string): ReturnType<typeof this.parse> => {
         if (value === null || value === undefined) return null
         return JSON.parse(value);
      }
   }

   constructor(model: ModelClass<M>, targetColumn: T) {
      super()
      this.model = model
      this.targetColumn = targetColumn
      this.index()
   }

   protected check(value: unknown) { }

   optional(): any {
      throw new Error("optional not supported");
   }

   nullable() {
      super.optional()
      return super.nullable();
   }
   index() {
      return this.set("index", () => { }, true)
   }

}

export default XqlRelationOne
