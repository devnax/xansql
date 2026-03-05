import { XVString } from "xanv"
import { XansqlDialectEngine } from "../../core/types"
import XqlFieldInfo from "../XqlFieldInfo"
import { escapeSqlValue } from "../../utils"

class XqlString extends XVString {
   table!: string
   column_name!: string
   engine!: XansqlDialectEngine

   readonly value = {
      toSql: (value: unknown): string => {
         const _value = super.parse(value) as string
         if (_value === undefined || _value === null) return 'NULL';
         return `'${escapeSqlValue(_value)}'`
      },
      fromSql: (value: string): ReturnType<typeof this.parse> => {
         if (value === null || value === undefined) return null
         return value
      }
   }

   get info(): XqlFieldInfo {
      return new XqlFieldInfo(this)
   }

   optional(): any {
      throw new Error("optional not supported")
   }
   nullable() {
      super.optional()
      return super.nullable();
   }
   index() {
      return this.set("index", () => { }, true)
   }

   text() {
      return this.set("text", () => { }, true)
   }

   unique() {
      return this.set("unique", () => { }, true)
   }

   email(): this {
      this.index()
      return super.email()
   }
}

export default XqlString