import columnTypes from "./columnTypes";

export type ReferenceValue = "CASCADE" | "SET NULL" | "SET DEFAULT" | "RESTRICT" | "NO ACTION";


export type SQLConstraints = {
   primaryKey?: boolean;
   references?: { table: string; column: string } | null;
   unique?: boolean;
   notNull?: boolean;
   unsigned?: boolean;
   default?: any;
   autoincrement?: boolean;
   index?: string | null;
   onDelete?: ReferenceValue | null;
   onUpdate?: "CURRENT_TIMESTAMP" | ReferenceValue | null;
   check: string | null;
   collate: string | null;
   comment: string | null;
}

export type ColumnTypes = typeof columnTypes[number];

export type ColumnValue = (string | number)[]