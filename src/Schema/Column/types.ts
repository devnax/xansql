
export type XansqlDataTypes =
   | "integer"
   | "bigInteger"
   | "decimal"
   | "float"
   | "boolean"
   | "tinyint"

   | "string"
   | "text"

   | "date"
   | "time"
   | "datetime"
   | "timestamp"

   | "json"
   | "jsonb"
   | "binary"

   | "uuid"
   | "enum"


export type DialectTypes = "mysql" | "postgres" | "sqlite" | "mssql"

export type XansqlDataTypesMap = {
   [key in XansqlDataTypes]: string
}

export type SQLConstraints = {
   primary?: boolean;
   references?: { table: string; column: string };
   unique?: boolean;
   nullable?: boolean;
   notNull?: boolean;
   unsigned?: boolean;
   default?: string;
   autoincrement?: boolean;
   index?: string;
   onDelete?: string;
   onUpdate?: string;
}