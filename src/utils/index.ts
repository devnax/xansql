import { XansqlDialectEngine } from "../core/types";

export const isArray = (v: any) => Array.isArray(v)
export const isObject = (v: any) => Object.prototype.toString.call(v) === '[object Object]';
export const isString = (v: any) => typeof v === 'string'
export const isNumber = (v: any) => typeof v === 'number' && !isNaN(v)

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


export const iof = (field: any, ...instances: any[]) => {
   return instances.some(instance => field instanceof instance || field?.constructor === instance.constructor);
}


export const quote = (engine: XansqlDialectEngine, identifier: string) => {
   if (engine === 'mysql') return `\`${identifier}\``;
   if (engine === 'postgresql' || engine === 'sqlite') return `"${identifier}"`;
   return identifier;
}