import columnTypes from "./columnTypes";

export type ReferenceValue = "CASCADE" | "SET NULL" | "SET DEFAULT" | "RESTRICT" | "NO ACTION";


export type SQLConstraints = {
   primaryKey?: boolean;
   references?: { table: string; column: string }
   unique?: boolean;
   notNull?: boolean;
   unsigned?: boolean;
   default?: any;
   autoincrement?: boolean;
   index?: string;
   onDelete?: ReferenceValue;
   onUpdate?: "CURRENT_TIMESTAMP" | ReferenceValue;
   check?: string;
   collate?: string;
   comment?: string;
}

export type ColumnTypes = typeof columnTypes[number];

export type ColumnValue = (string | number)[]