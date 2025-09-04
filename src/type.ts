import Schema from "./Schema";
import Xansql from "./Xansql";

export type DialectOptions = {
   excute: (query: string, schema: Schema) => Promise<any>;
   migrate: (schema: Schema) => Promise<void>;
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

export type RelationInfo = {
   single: boolean,
   main: {
      table: string,
      column: string,
   },
   foregin: {
      table: string,
      column: string,
   }
}


export type ForeignInfo = {
   type: "hasOne" | "hasMany",
   table: string,
   column: string,
   relation: {
      main: string,
      target: string,
   }
}
export type ForeignsInfo = {
   [table: string]: {
      [column: string]: ForeignInfo
   }
}