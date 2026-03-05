import { Infer, XVArray, XVType } from "xanv"
import { XansqlDialectEngine } from "../../core/types";
import XqlFieldInfo from "../XqlFieldInfo";
import { escapeSqlValue } from "../../utils";

class XqlArray<T extends XVType<any>> extends XVArray<T> {

   table!: string
   column_name!: string
   engine!: XansqlDialectEngine

   readonly value = {
      toSql: (value: unknown) => {
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


}

export default XqlArray