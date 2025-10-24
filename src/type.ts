import { SecurequClientConfig, SecurequServerConfig } from "securequ";
import Schema from "./Schema";
import Xansql from "./Xansql";
import { AggregateArgsType, CreateArgsType, DataArgsType, DeleteArgsType, FindArgsType, UpdateArgsType, UpdateDataArgsType, WhereArgsType } from "./Schema/type";


export type Result = {
   [key: string]: any
} | null

export type ExecuterResult = {
   result: Result[];
   affectedRows: number;
   insertId: number | null;
}

export type DialectOptions = {
   execute: (query: string, schema: Schema) => Promise<ExecuterResult>;
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
   logging?: boolean
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



export type XansqlModelOptions = {
   hooks?: {
      beforeFind?: (args: FindArgsType) => Promise<FindArgsType> | FindArgsType;
      afterFind?: (result: any, args: FindArgsType) => Promise<any> | any;
      beforeCreate?: (args: CreateArgsType) => Promise<CreateArgsType> | (CreateArgsType);
      afterCreate?: (result: any, args: CreateArgsType) => Promise<any> | any;
      beforeUpdate?: (args: UpdateArgsType) => Promise<UpdateArgsType> | UpdateArgsType;
      afterUpdate?: (result: any, args: UpdateArgsType) => Promise<any> | any;
      beforeDelete?: (args: DeleteArgsType) => Promise<DeleteArgsType> | DeleteArgsType;
      afterDelete?: (result: any, args: DeleteArgsType) => Promise<any> | any;
      beforeAggregate?: (args: AggregateArgsType) => Promise<AggregateArgsType> | AggregateArgsType;
      afterAggregate?: (result: any, args: AggregateArgsType) => Promise<any> | any;
   }
}