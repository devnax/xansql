import Model from "../model";
import { AggregateArgsType, CreateArgsType, DeleteArgsType, FindArgsType, UpdateArgsType } from "../model/types";
import Xansql from "./Xansql";

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

export type XansqlFileMeta = {
   fileId: string;
   name: string;
   size: number;
   type: string;
   chunkIndex: number;
   totalChunks: number;
   isFinish: boolean;
};

export type XansqlFileConfig = {
   deleteFileOnMigration?: boolean;
   maxFilesize?: number; // in KB
   checkFileType?: boolean;
   chunkSize?: number; // in KB
   upload: (file: File, xansql: Xansql) => Promise<XansqlFileMeta>;
   delete: (filename: string, xansql: Xansql) => Promise<void>;
}


export type XansqlDialect = {
   engine: XansqlDialectEngine;
   file?: XansqlFileConfig
   execute: (sql: string, xansql: Xansql) => Promise<ExecuterResult | null>;
   getSchema: (xansql: Xansql) => Promise<XansqlDialectSchemaType | void>;
}

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

export type XansqlConfigType = {
   dialect: XansqlDialect;
   socket?: XansqlSocket;
   cache?: XansqlCache;

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