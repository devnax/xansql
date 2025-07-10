import BaseDialect from "./dialects/BaseDialect";
import Model from "./model";

export type Dialect = {
   name: string;
   excute: (query: string) => Promise<any>;
   migrate: (model: Model) => string;
}

export type XansqlCacheOptions = {
   set: (key: string, value: any) => void;
   get: (key: string) => any;
   delete: (key: string) => void;
   clear: () => void;
   has: (key: string) => boolean;
}

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
   cache?: XansqlCacheOptions[];
   // maxDataLimit?: number;
}

export type XansqlConfigFunction = () => XansqlConfigOptions;
export type XansqlConfig = XansqlConfigOptions | XansqlConfigFunction;
export const DialectDrivers = ["mysql", "sqlite", "postgres"] as const

export type XansqlDialectDriver = typeof DialectDrivers[number];
export type XansqlDialectsFactory = Map<XansqlDialectDriver, BaseDialect>;

export type XansqlDialectExcuteReturn<DATA> = {
   result: DATA[] | null,
   affectedRows: number,
   insertId: number,
}

export type ModelTableName = string
export type XansqlModelsFactory = Map<ModelTableName, Model>;