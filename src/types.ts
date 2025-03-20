import SchemaBuilder from "./SchemaBuilder";


export type DBDialect = 'sqlite' | 'mysql' | 'postgres';

export type XansqlConfig = {
   dialect: DBDialect; // sqlite | mysql | postgres
   storage?: string;
   host: string;
}

export type TableName = string;

export type ModelValue = {
   model: any;
   instance: any;
   schema: SchemaBuilder
}
export type Models = Map<TableName, ModelValue>;