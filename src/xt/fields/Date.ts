import { XVDate, XVOptional } from "xanv"
import { XansqlDialectEngine } from "../../core/types"
import XqlFieldInfo from "../XqlFieldInfo"
import { escapeSqlValue, iof } from "../../utils"

class XqlDate extends XVDate {
   table!: string
   column_name!: string
   engine!: XansqlDialectEngine

   readonly value = {
      toSql: (value: unknown): string => {
         value = super.parse(value)
         if (value === undefined || value === null) return 'NULL';

         const date =
            value instanceof Date
               ? value
               : typeof value === "string" || typeof value === "number"
                  ? new Date(value)
                  : null

         if (!date || isNaN(date.getTime())) {
            throw new Error(
               `Invalid date value for column ${this.column_name}: ${value}`
            )
         }

         const formatted = date
            .toISOString()
            .replace('T', ' ')
            .replace('Z', '')

         return `'${escapeSqlValue(formatted)}'`
      },

      fromSql: (value: string): ReturnType<typeof this.parse> => {
         if (value === null || value === undefined) return null
         return new Date(value);
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

   createdAt(): XVOptional<this> & { meta: { createdAt: true } } {
      return this.index().set("createdAt", () => { }, true) as any
   }

   updatedAt(): XVOptional<this> & { meta: { updatedAt: true } } {
      return this.set("updatedAt", () => { }, true) as any
   }
}

export default XqlDate