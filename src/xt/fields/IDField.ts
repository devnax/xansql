import { XVNumber } from "xanv"
import { XansqlDialectEngine } from "../../core/types"
import XqlFieldInfo from "../XqlFieldInfo"

class XqlIDField extends XVNumber {
   type = "IDField"
   table!: string
   column_name!: string
   engine!: XansqlDialectEngine

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

   get info(): XqlFieldInfo {
      return new XqlFieldInfo(this)
   }



   optional(): any {
      throw new Error("Optional not allowed")
   }
   nullable(): any {
      throw new Error("nullable not allowed")
   }
}

export default XqlIDField