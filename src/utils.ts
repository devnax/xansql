export const isServer = typeof window === 'undefined'
export const isArray = (v: any) => Array.isArray(v)
export const isObject = (v: any) => typeof v === 'object' && v !== null && !isArray(v)
export const isString = (v: any) => typeof v === 'string'
export const isNumber = (v: any) => typeof v === 'number' && !isNaN(v)
export const isBoolean = (v: any) => typeof v === 'boolean'

export const formatValue = (v: any): any => {
   if (v instanceof Date) v = v.toISOString()
   if (isString(v)) return `'${escapeSqlValue(v)}'`
   if (isNumber(v)) return v
   if (isBoolean(v)) return v ? 'TRUE' : 'FALSE'
   if (v === null) return 'NULL'
   if (v === undefined) return 'NULL'
   if (isArray(v)) return v.map((item) => formatValue(item)).join(',')
}

export const arrayMove = (arr: any[], fromIndex: number, toIndex: number) => {
   const newArr = [...arr];
   const item = newArr.splice(fromIndex, 1)[0];
   newArr.splice(toIndex, 0, item);
   return newArr;
}

export const escapeSqlValue = (value: string): string => {
   return value
      .replace(/\\/g, '\\\\')   // Escape backslash
      .replace(/'/g, `''`)      // Escape single quote by doubling it
      .replace(/"/g, `\\"`)     // Escape double quote
      .replace(/\n/g, '\\n')    // Escape newlines
      .replace(/\r/g, '\\r')    // Escape carriage returns
      .replace(/\x00/g, '\\0');
}
