import { XVFile } from "xanv"
import { XansqlDialectEngine } from "../../core/types"
import XqlFieldInfo from "../XqlFieldInfo"
import { escapeSqlValue } from "../../utils"

class XqlFile extends XVFile {
   table!: string
   column_name!: string
   engine!: XansqlDialectEngine
   readonly value = {
      toSql: (value: unknown): string => {
         const file = super.parse(value) as File
         if (file === undefined || file === null) return 'NULL';
         return `'${escapeSqlValue(file.name)}'`;
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

export default XqlFile