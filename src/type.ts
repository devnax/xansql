import { SecurequClientConfig, SecurequServerConfig } from "securequ";
import Schema from "./Schema";
import Xansql from "./Xansql";


export type Result = {
   [key: string]: any
} | null

export type ExcuterResult = {
   result: Result[];
   affectedRows: number;
   insertId: number | null;
}

export type DialectOptions = {
   excute: (query: string, schema: Schema) => Promise<ExcuterResult>;
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

export type XansqlCacheOptions = {
   cache: (sql: string, model: Schema) => Promise<Result[] | void>;
   clear: (model: Schema) => Promise<void>;

   onFind: (sql: string, model: Schema, data: Result) => Promise<void>;
   onCreate: (model: Schema, insertId: number) => Promise<void>;
   onUpdate: (model: Schema, rows: Result[]) => Promise<void>;
   onDelete: (model: Schema, rows: Result[]) => Promise<void>;
}

export type XansqlCachePlugin = (xansql: Xansql) => Promise<XansqlCacheOptions>;

export type XansqlConfigOptions = {
   dialect: Dialect;
   connection: string | XansqlConnectionOptions;
   cachePlugins?: XansqlCachePlugin[];
   maxLimit?: {
      find?: number;
      create?: number;
      update?: number;
      delete?: number;
   },
   listenerConfig?: {
      server: SecurequServerConfig,
      client: SecurequClientConfig
   } | null;
}

export type XansqlConfigOptionsRequired = Required<XansqlConfigOptions> & {
   maxLimit: Required<XansqlConfigOptions['maxLimit']>;
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