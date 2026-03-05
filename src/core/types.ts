import Model from "../model";
import { AggregateArgs, CreateArgs, DeleteArgs, FindArgs, SchemaShape, UpdateArgs } from "../model/types";
import Xansql from "./Xansql";

// type NoInfer<T> = [T][T extends any ? 0 : never]
// export type ModelCallback<C extends object> = (xt: any) => NoInfer<C>

export type XansqlFileUploadArgs = File | {
   chunk: Uint8Array;
   meta: XansqlFileMeta
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

export type XansqlDialectEngine = 'mysql' | 'postgres' | 'sqlite'

export type XansqlFileMeta = {
   fileId: string;
   name: string;
   size: number;
   type: string;
   chunkIndex: number;
   totalChunks: number;
   isFinish: boolean;
};

export type XansqlDialect = {
   execute: (sql: string, xansql: Xansql) => Promise<ExecuterResult | null>;
   engine: XansqlDialectEngine;
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


export type XansqlHooks = {
   beforeExcute?: (model: Model, sql: string) => Promise<string | void>
   afterExcute?: (model: Model, result: ExecuterResult) => Promise<ExecuterResult | void>
   beforeFind?: (model: Model, args: FindArgs<SchemaShape>) => Promise<FindArgs<SchemaShape> | void>;
   afterFind?: (model: Model, result: ResultData, args: FindArgs<SchemaShape>) => Promise<ResultData | void>;
   beforeCreate?: (model: Model, args: CreateArgs<SchemaShape>) => Promise<CreateArgs<SchemaShape> | void>
   afterCreate?: (model: Model, result: ResultData, args: CreateArgs<SchemaShape>) => Promise<ResultData | void>;
   beforeUpdate?: (model: Model, args: UpdateArgs<SchemaShape>) => Promise<UpdateArgs<SchemaShape> | void>;
   afterUpdate?: (model: Model, result: ResultData, args: UpdateArgs<SchemaShape>) => Promise<ResultData | void>;
   beforeDelete?: (model: Model, args: DeleteArgs<SchemaShape>) => Promise<DeleteArgs<SchemaShape> | void>;
   afterDelete?: (model: Model, result: ResultData, args: DeleteArgs<SchemaShape>) => Promise<ResultData | void>;
   beforeAggregate?: (model: Model, args: AggregateArgs<SchemaShape, any>) => Promise<AggregateArgs<SchemaShape, any> | void>;
   afterAggregate?: (model: Model, result: ResultData, args: AggregateArgs<SchemaShape, any>) => Promise<ResultData | void>;

   transform?: (model: Model, row: RowObject) => Promise<RowObject | void>
}

export type XansqlFileConfig = {
   maxFilesize?: number;
   checkFileType?: boolean;
   chunkSize?: number;
   upload: (chunk: Uint8Array, filemeta: XansqlFileMeta, xansql: Xansql) => Promise<XansqlFileMeta>;
   delete: (fileId: string, xansql: Xansql) => Promise<void>;
};

export type XansqlConfigType = {
   dialect: XansqlDialect;
   file?: XansqlFileConfig
   socket?: XansqlSocket;
   cache?: XansqlCache;
   debug?: boolean;
   hooks?: XansqlHooks
}

export type XansqlConfigTypeRequired = Required<XansqlConfigType>