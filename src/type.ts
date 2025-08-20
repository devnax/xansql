import Schema from "./Schema";
import Xansql from "./Xansql";

export type DialectOptions = {
   excute: (query: string, schema: Schema) => Promise<any>;
   buildSchema: (schema: Schema) => string;
   addColumn: (schema: Schema, columnName: string) => Promise<any>;
   dropColumn: (schema: Schema, columnName: string) => Promise<any>;
   renameColumn: (schema: Schema, oldName: string, newName: string) => Promise<any>;
   addIndex: (schema: Schema, columnName: string) => Promise<any>;
   dropIndex: (schema: Schema, columnName: string) => Promise<any>;
}

export type Dialect = (xansql: Xansql) => DialectOptions

export type XansqlConnectionOptions = {
   host: string,
   user: string,
   password: string,
   database: string,
   port: number;
}

export type XansqlConfigOptions = {
   dialect: Dialect;
   connection: string | XansqlConnectionOptions;
   cachePlugins?: any[];
   maxFindLimit?: number;
   client?: {
      basepath: string;
   }
}

export type XansqlConfigFunction = () => XansqlConfigOptions;
export type XansqlConfig = XansqlConfigOptions | XansqlConfigFunction;