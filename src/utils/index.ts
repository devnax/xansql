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

// export const uid = (str: string, length = 28): string => {
//    let h1 = 0x811c9dc5;
//    let h2 = 0x811c9dc5 ^ str.length;

//    // Simple dual-hash loop
//    for (let i = 0; i < str.length; i++) {
//       const c = str.charCodeAt(i);
//       h1 = Math.imul(h1 ^ c, 0x1000193);
//       h2 = Math.imul(h2 ^ (c + i * 17), 0x85ebca6b);
//    }

//    // Base36 mix gives letters + digits
//    let base = (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36);

//    // Add derived chars from original string to strengthen variety
//    for (let i = 0; i < str.length; i++) {
//       const code = str.charCodeAt(i);
//       base += ((code * (i + 31)) % 36).toString(36);
//    }

//    // Scramble characters deterministically based on input
//    const arr = base.split('');
//    for (let i = arr.length - 1; i > 0; i--) {
//       const j = (str.charCodeAt(i % str.length) + i * 19) % arr.length;
//       [arr[i], arr[j]] = [arr[j], arr[i]];
//    }

//    // Ensure letters are mixed in
//    const mixed = arr
//       .map((c, i) =>
//          i % 3 === 0 ? String.fromCharCode(97 + (c.charCodeAt(0) % 26)) : c
//       )
//       .join('');

//    return mixed.slice(0, length);
// }
