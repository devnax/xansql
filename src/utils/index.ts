import XanvType from "xanv/XanvType"
import { XansqlDialectEngine } from "../core/type";


export const isServer = () => typeof window === 'undefined'
export const isArray = (v: any) => Array.isArray(v)
// export const isObject = (v: any) => typeof v === 'object' && v !== null && !isArray(v) && !(v instanceof Date) && !(v instanceof RegExp) && !(v instanceof Buffer) && !(v instanceof Uint8Array) && !(v instanceof ArrayBuffer)
export const isObject = (v: any) => Object.prototype.toString.call(v) === '[object Object]';
export const isString = (v: any) => typeof v === 'string'
export const isNumber = (v: any) => typeof v === 'number' && !isNaN(v)
export const isBoolean = (v: any) => typeof v === 'boolean'

export const formatValue = (v: any, xanv?: XanvType<any, any>): any => {
   if (isArray(v)) return v.map((item) => formatValue(item, xanv)).join(',')
   !!xanv && xanv.parse(v);
   if (v instanceof Date) v = v.toISOString()
   if (isString(v)) return `'${escapeSqlValue(v)}'`
   if (isNumber(v)) return v
   if (isBoolean(v)) return v ? 'TRUE' : 'FALSE'
   if (v === null) return 'NULL'
   if (v === undefined) return 'NULL'
}

export const arrayMove = (arr: any[], fromIndex: number, toIndex: number) => {
   const newArr = [...arr];
   const item = newArr.splice(fromIndex, 1)[0];
   newArr.splice(toIndex, 0, item);
   return newArr;
}

export const escapeSqlValue = (value: string): string => {
   return value
      .replace(/'/g, "''")   // Escape single quote
      .replace(/\x00/g, '\\0'); // Escape null byte (rare but can break SQL)
}


export const freezeObject = (obj: any) => {
   Object.getOwnPropertyNames(obj).forEach((prop) => {
      const value = obj[prop];
      if (value && typeof value === "object") {
         freezeObject(value); // recursively freeze
      }
   });
   return Object.freeze(obj);
}



export const ErrorWhene = (_if: any, message: string) => {
   if (_if) {
      throw new Error(message);
   }
}

export const quote = (engine: XansqlDialectEngine, str?: string) => {
   let q = ''
   if (engine === 'mysql' || engine === 'sqlite') {
      q = '`';
   } else if (engine === 'postgresql' || engine === 'mssql') {
      q = '"';
   } else {
      throw new Error(`Unsupported dialect engine: ${engine}`);
   }

   return str ? `${q}${str}${q}` : q;
}