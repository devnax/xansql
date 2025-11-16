import { UploadFileMeta } from "securequ";
import Model from "../model";
import { AggregateArgsType, CreateArgsType, DeleteArgsType, FindArgsType, UpdateArgsType } from "../model/type";
import { ExecuteMetaData } from "./ExcuteMeta";

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

export type XansqlFetchPermissionInfo = ExecuteMetaData & {
   method: XansqlFetchMethod;
}
export type XansqlOnFetchInfo = {
   body: any;
   headers: { [key: string]: string };
   cookies: { [key: string]: string };
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
   cache: (sql: string, model: Model) => Promise<Row[] | void>;
   clear: (model: Model) => Promise<void>;
   onFind: (sql: string, model: Model, data: Row) => Promise<void>;
   onCreate: (model: Model, insertId: number) => Promise<void>;
   onUpdate: (model: Model, rows: Row[]) => Promise<void>;
   onDelete: (model: Model, rows: Row[]) => Promise<void>;
}

export type XansqlFileMeta = UploadFileMeta

// export type XansqlFile = {
//    upload: (chunk: Uint8Array, filemeta: XansqlFileMeta, model?: Model) => Promise<void>;
//    delete: (filename: string, model?: Model) => Promise<boolean>
// }


export type XansqlFetchUrl = string

export type XansqlFetchConfig = {
   url: XansqlFetchUrl;
   mode?: "production" | "development";
}

export type XansqlFileConfig = {
   maxFilesize?: number; // in KB
   checkFileType?: boolean;
   chunkSize?: number; // in KB
   upload: (chunk: Uint8Array, filemeta: UploadFileMeta) => Promise<void>;
   delete: (filename: string) => Promise<void>;
}

export type XansqlConfigType = {
   dialect: XansqlDialect;
   fetch?: XansqlFetchUrl | XansqlFetchConfig
   socket?: XansqlSocket;
   cache?: XansqlCache;

   file?: XansqlFileConfig

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