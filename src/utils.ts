export const isServer = typeof window === 'undefined'
export const isArray = (v: any) => Array.isArray(v)
export const isObject = (v: any) => typeof v === 'object' && v !== null && !isArray(v)
export const isString = (v: any) => typeof v === 'string'
export const isNumber = (v: any) => typeof v === 'number' && !isNaN(v)
export const isBoolean = (v: any) => typeof v === 'boolean'
export const formatValue = (v: any): any => {
   if (isString(v)) {
      v = sanitizeSqlValue(v)
      return `'${v}'`
   }
   if (isNumber(v)) {
      return v
   }
   if (isBoolean(v)) return v ? 'TRUE' : 'FALSE'
   if (v === null) return 'NULL'
   if (v === undefined) return 'NULL'
   if (v instanceof Date) return `'${v.toISOString()}'`
   if (isArray(v)) {
      return v.map((item) => formatValue(item)).join(',')
   }
}

export const arrayMove = (arr: any[], fromIndex: number, toIndex: number) => {
   const newArr = [...arr];
   const item = newArr.splice(fromIndex, 1)[0];
   newArr.splice(toIndex, 0, item);
   return newArr;
}

export const sanitizeSqlValue = (v: string): string => {
   return v
      .replace(/\\/g, '\\\\')   // Escape \
      .replace(/'/g, `\\'`)     // Escape '
      .replace(/"/g, `\\"`)     // Escape "
      .replace(/\n/g, '\\n')    // Newlines
      .replace(/\r/g, '\\r')    // Carriage return
      .replace(/\x00/g, '\\0')  // Null byte
}

