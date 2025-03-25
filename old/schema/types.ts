import Column from "./Column"
import Relation from "./Relation"

export type SchemaMap = {
   [key: string]: Column | Relation
}


export type Dialects = 'mysql' | 'postgres' | 'sqlite' | 'mssql'