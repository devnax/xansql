import xansql from ".";
import Model from "./model";

export type DialectOptions = {
   name: string;
   excute: (query: string, model: Model) => Promise<any>;
   buildSchema: (model: Model) => string;
}

export type Dialect = (xansql: xansql) => DialectOptions | Promise<DialectOptions>;

export type XansqlCacheOnCacheArgs = {
   sql: string;
   model: Model;
   requestData?: any;
}
export type XansqlCacheFNArgs = {
   sql: string;
   result: any;
   model: Model;
   requestData?: any;
}

export type XansqlCacheOptions = {
   onCache: (info: XansqlCacheOnCacheArgs) => Promise<any>;
   onFind: (info: XansqlCacheFNArgs) => Promise<void>;
   onDestroy: (info: XansqlCacheFNArgs) => Promise<void>;

   onCreate?: (info: XansqlCacheFNArgs) => Promise<void>;
   onUpdate?: (info: XansqlCacheFNArgs) => Promise<void>;
   onDelete?: (info: XansqlCacheFNArgs) => Promise<void>;
}

export type XansqlCache = (xansql: xansql) => XansqlCacheOptions | Promise<XansqlCacheOptions>;

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
   cachePlugins?: XansqlCache[];
   maxFindLimit?: number;
   client?: {
      basepath: string;
   }
}

export type XansqlConfigFunction = () => Promise<XansqlConfigOptions> | XansqlConfigOptions;
export type XansqlConfig = XansqlConfigOptions | XansqlConfigFunction;

export type XansqlDialectExcuteReturn<DATA> = {
   result: DATA[] | null,
   affectedRows: number,
   insertId: number,
}

export type ModelTableName = string
export type XansqlModelsFactory = Map<ModelTableName, Model>;