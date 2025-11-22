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


export type RowObject = {
   [key: string]: any;
}

export type ResultData = RowObject[]

export type ExecuterResult<Row = RowObject> = {
   results: ResultData;
   affectedRows: number;
   insertId: number | null;
}

export type XansqlDialectEngine = 'mysql' | 'postgresql' | 'sqlite'
export type XansqlDialectSchemaColumn = {
   name: string;
   type: string;
   notnull: boolean;
   default_value: any;
   pk: boolean;
   index: boolean;
   unique: boolean;
}
export type XansqlDialectSchemaType = {
   [table: string]: XansqlDialectSchemaColumn[]
}
export type XansqlDialect = {
   engine: XansqlDialectEngine;
   execute: (sql: string) => Promise<ExecuterResult | null>;
   getSchema: () => Promise<XansqlDialectSchemaType | void>;
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

   file?: XansqlFileConfig;

   maxLimit?: {
      find?: number;
      create?: number;
      update?: number;
      delete?: number;
   },

   hooks?: {
      beforeFind?: (model: Model, args: FindArgsType) => Promise<FindArgsType>;
      afterFind?: (model: Model, result: ResultData, args: FindArgsType) => Promise<ResultData>;
      beforeCreate?: (model: Model, args: CreateArgsType) => Promise<CreateArgsType>
      afterCreate?: (model: Model, result: ResultData, args: CreateArgsType) => Promise<ResultData>;
      beforeUpdate?: (model: Model, args: UpdateArgsType) => Promise<UpdateArgsType>;
      afterUpdate?: (model: Model, result: ResultData, args: UpdateArgsType) => Promise<ResultData>;
      beforeDelete?: (model: Model, args: DeleteArgsType) => Promise<DeleteArgsType>;
      afterDelete?: (model: Model, result: ResultData, args: DeleteArgsType) => Promise<ResultData>;
      beforeAggregate?: (model: Model, args: AggregateArgsType) => Promise<AggregateArgsType>;
      afterAggregate?: (model: Model, result: ResultData, args: AggregateArgsType) => Promise<ResultData>;

      transform?: (model: Model, row: RowObject) => Promise<RowObject>
   }
}

export type XansqlConfigTypeRequired = Required<XansqlConfigType> & {
   maxLimit: Required<XansqlConfigType['maxLimit']>;
}

export type XansqlModelOptions = {
   hooks?: {
      beforeFind?: (args: FindArgsType) => Promise<FindArgsType>
      afterFind?: (result: ResultData, args: FindArgsType) => Promise<ResultData>
      beforeCreate?: (args: CreateArgsType) => Promise<CreateArgsType> | void
      afterCreate?: (result: ResultData, args: CreateArgsType) => Promise<ResultData>
      beforeUpdate?: (args: UpdateArgsType) => Promise<UpdateArgsType>
      afterUpdate?: (result: ResultData, args: UpdateArgsType) => Promise<ResultData>
      beforeDelete?: (args: DeleteArgsType) => Promise<DeleteArgsType>
      afterDelete?: (result: ResultData, args: DeleteArgsType) => Promise<ResultData>
      beforeAggregate?: (args: AggregateArgsType) => Promise<AggregateArgsType>
      afterAggregate?: (result: ResultData, args: AggregateArgsType) => Promise<ResultData>
      transform?: (row: RowObject) => Promise<RowObject>

   }
}