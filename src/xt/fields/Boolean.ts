import { XVBoolean } from "xanv"
import { XansqlDialectEngine } from "../../core/types";
import XqlFieldInfo from "../XqlFieldInfo";

class XqlBoolean extends XVBoolean {
   table!: string
   column_name!: string
   engine!: XansqlDialectEngine

   readonly value = {
      toSql: (value: unknown): string => {
         let _value = super.parse(value)
         if (_value === undefined || _value === null) return 'NULL';
         return _value ? "1" : "0"
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
   nullable(): any {
      throw new Error("nullable not supported");
   }
   index() {
      return this.set("index", () => { }, true)
   }
}

export default XqlBoolean