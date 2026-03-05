import { XVNumber } from "xanv"
import { XansqlDialectEngine } from "../../core/types"
import XqlFieldInfo from "../XqlFieldInfo"

class XqlNumber extends XVNumber {
   table!: string
   column_name!: string
   engine!: XansqlDialectEngine

   readonly value = {
      toSql: (value: unknown): string => {
         value = super.parse(value) as any
         if (value === undefined || value === null) return 'NULL';
         return `${value}`
      },
      fromSql: (value: unknown): ReturnType<typeof this.parse> => {
         if (value === null || value === undefined) return null
         return JSON.parse(value as any);
      }
   }

   get info(): XqlFieldInfo {
      return new XqlFieldInfo(this)
   }



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
   unique() {
      return this.set("unique", () => { }, true)
   }

   decimal(precision: number, scale: number) {
      return this.set("decimal", () => { }, { precision, scale })
   }

   bigint() {
      return this.set("bigint", () => { }, true)
   }

   double() {
      return this.set("double", () => { }, true)
   }
}

export default XqlNumber