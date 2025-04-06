export const isServer = typeof window === 'undefined'
export const isArray = (v: any) => Array.isArray(v)
export const isObject = (v: any) => typeof v === 'object' && !isArray(v)