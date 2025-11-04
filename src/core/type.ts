import { SecurequClientConfig, SecurequServerConfig } from "securequ";
import Schema from "../Schema";
import Xansql from "./Xansql";
import { AggregateArgsType, CreateArgsType, DeleteArgsType, FindArgsType, UpdateArgsType } from "../Schema/type";

export type XansqlConnectionOptions = {
   host: string,
   user: string,
   password: string,
   database: string,
   port: number;
}

export type ExecuterResult<Row = object> = {
   results: Row[];
   affectedRows: number;
   insertId: number | null;
}

export type XansqlDialectEngine = 'mysql' | 'postgresql' | 'sqlite'
export type XansqlDialect = {
   engine: XansqlDialectEngine;
   execute: (sql: string) => Promise<ExecuterResult | null>;
}

// FETCH TYPE
export type XansqlOnFetchInfo = {
   method: string;
   path: string;
   origine: string;
   query: any;
   body: any;
   headers: { [key: string]: string };
   cookies: { [key: string]: string };
}

export type XansqlFetch = {
   execute: (sql: string) => Promise<ExecuterResult>;
   onFetch: (xansql: Xansql, info: XansqlOnFetchInfo) => Promise<any>;
}

export type XansqlSocket = {
   open: (socket: WebSocket) => Promise<void>;
   message: (socket: WebSocket, data: any) => Promise<void>;
   close: (socket: WebSocket) => Promise<void>;
}

export type XansqlCache<Row = object> = {
   cache: (sql: string, model: Schema) => Promise<Row[] | void>;
   clear: (model: Schema) => Promise<void>;
   onFind: (sql: string, model: Schema, data: Row) => Promise<void>;
   onCreate: (model: Schema, insertId: number) => Promise<void>;
   onUpdate: (model: Schema, rows: Row[]) => Promise<void>;
   onDelete: (model: Schema, rows: Row[]) => Promise<void>;
}

export type XansqlConfigType = {
   dialect: XansqlDialect;
   fetch?: XansqlFetch;
   socket?: XansqlSocket;
   cache?: XansqlCache;

   maxLimit?: {
      find?: number;
      create?: number;
      update?: number;
      delete?: number;
   },
}

export type XansqlConfigTypeRequired = Required<XansqlConfigType> & {
   maxLimit: Required<XansqlConfigType['maxLimit']>;
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