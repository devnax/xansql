import Schema from "../Schema";
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
export type XansqlFetchMethod = "GET" | "POST" | "PUT" | "DELETE"
export type XansqlFetchPermissionType =
   | "find"
   | "insert"
   | "update"
   | "delete"
   | "aggregate"
   | "executer"
   | "createTable"
   | "dropTable"
   | "alterTable"
   | "uploadFile"
   | "deleteFile"

export type XansqlFetchPermissionInfo = {
   method: XansqlFetchMethod;
   table: string | null;
   type: XansqlFetchPermissionType;
   modle: Schema | null;
}
export type XansqlOnFetchInfo = {
   body: any;
   headers: { [key: string]: string };
   cookies: { [key: string]: string };
   beforeRequest?: (info: XansqlOnFetchInfo) => Promise<XansqlOnFetchInfo>;
   afterResponse?: (response: XansqlOnFetchResponse) => Promise<XansqlOnFetchResponse>;
   isAuthorized?: (info: XansqlFetchPermissionInfo) => Promise<boolean>;
}

export type XansqlOnFetchResponse = {
   status: number;
   body: any;
   headers?: { [key: string]: string };
   cookies?: { [key: string]: string };
};


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

export type XansqlFileMeta = {
   name: string;
   original_name: string;
   size: number;
   mime: string;
   total_chunks: number;
   isFinish: boolean
}

export type XansqlFile = {
   upload: (chunk: Uint8Array, chunkIndex: number, filemeta: XansqlFileMeta) => Promise<void>;
   delete: (filename: string) => Promise<boolean>
}


export type XansqlFetchUrl = string

export type XansqlFetchConfig = {
   url: XansqlFetchUrl;
   mode?: "production" | "development";
}

export type XansqlConfigType = {
   dialect: XansqlDialect;
   fetch?: XansqlFetchUrl | XansqlFetchConfig
   socket?: XansqlSocket;
   cache?: XansqlCache;

   file?: XansqlFile

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