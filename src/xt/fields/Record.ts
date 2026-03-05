import { XVType, XVRecord } from "xanv"
import { XansqlDialectEngine } from "../../core/types"
import XqlFieldInfo from "../XqlFieldInfo"
import { escapeSqlValue } from "../../utils"

class XqlRecord<K extends XVType<any>, V extends XVType<any>> extends XVRecord<K, V> {
   table!: string
   column_name!: string
   engine!: XansqlDialectEngine

   readonly value = {
      toSql: (value: unknown): string => {
         let _value: string = super.parse(value) as any
         if (_value === undefined || _value === null) return 'NULL';
         _value = JSON.stringify(_value);
         return `'${escapeSqlValue(_value)}'`;
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

   unique() {
      return this.set("unique", () => { }, true)
   }
}

export default XqlRecord