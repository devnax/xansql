export const isServer = typeof window === 'undefined'
export const isArray = (v: any) => Array.isArray(v)
export const isObject = (v: any) => typeof v === 'object' && v !== null && !isArray(v)
export const isString = (v: any) => typeof v === 'string'
export const isNumber = (v: any) => typeof v === 'number' && !isNaN(v)
export const isBoolean = (v: any) => typeof v === 'boolean'
export const formatValue = (v: any): any => {
   if (isString(v)) return `'${v}'`
   if (isNumber(v)) return v
   if (isBoolean(v)) return v ? 'TRUE' : 'FALSE'
   if (v === null) return 'NULL'
   if (v === undefined) return 'NULL'
   if (v instanceof Date) return `'${v.toISOString()}'`
   if (isArray(v)) {
      return v.map((item) => formatValue(item)).join(',')
   }
}