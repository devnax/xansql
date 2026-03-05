import { XansqlDialectEngine } from "../core/types";

export const isArray = (v: any) => Array.isArray(v)
export const isObject = (v: unknown): v is Record<string, unknown> => {
   return Object.prototype.toString.call(v) === '[object Object]';
};
export const isString = (v: any) => typeof v === 'string'
export const isNumber = (v: any) => typeof v === 'number' && !isNaN(v)

// export const escapeSqlValue = (value: string): string => {
//    if (value === null || value === undefined) {
//       return ""
//    }
//    const str = String(value)
//    const escaped = str.replace(/'/g, "''")
//    return escaped
// }

export const escapeSqlValue = (value: any): string => {
   if (value === null || value === undefined) return "NULL";

   if (typeof value === "string") {
      return value.replace(/'/g, "''"); // wrap in quotes
   }

   if (typeof value === "number") return value.toString();
   if (typeof value === "boolean") return value ? "TRUE" : "FALSE";

   // if (value instanceof Date) return value.toISOString();

   throw new Error(`Cannot escape value of type ${typeof value}`);
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

type Constructor<T = any> = new (...args: any[]) => T;

export function iof<
   T extends Constructor[]
>(
   value: any,
   ...types: T
): value is InstanceType<T[number]> {
   return types.some(type => value instanceof type);
}

export const quote = (engine: XansqlDialectEngine, identifier: string) => {
   if (engine === 'mysql') return `\`${identifier}\``;
   if (engine === 'postgres' || engine === 'sqlite') return `"${identifier}"`;
   return identifier;
}



type AnyObject = Record<string, any>;

export function deepMerge<T extends AnyObject, S extends AnyObject>(
   target: T,
   source: S
): T & S {
   const output = { ...target } as T & S;

   for (const key in source) {
      if (source.hasOwnProperty(key)) {
         const sourceValue = source[key];
         const targetValue = target[key as keyof T];

         if (
            sourceValue &&
            typeof sourceValue === "object" &&
            !Array.isArray(sourceValue) &&
            targetValue &&
            typeof targetValue === "object" &&
            !Array.isArray(targetValue)
         ) {
            (output as any)[key] = deepMerge(
               targetValue as AnyObject,
               sourceValue as AnyObject
            );
         } else {
            (output as any)[key] = sourceValue;
         }
      }
   }

   return output;
}