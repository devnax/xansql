import Model from "./model";

export type Dialect = {
   name: string;
   excute: (query: string, config: XansqlConfigOptions) => Promise<any>;
   buildSchema: (model: Model) => string;
}

export type XansqlCacheOptions = {
   onCreate: (data: any, model: Model) => Promise<any>;
   onUpdate: (data: any, where: any) => Promise<{ data: any, where: any }>;
   onFind: (where: any) => Promise<any>;
   onCache: (where: any) => Promise<any>;
   onFelete: (key: string) => void;
   onDestroy: () => void;
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
   maxFindLimit?: number;
   client?: {
      basepath: string;
   }
}

export type XansqlConfigFunction = () => XansqlConfigOptions;
export type XansqlConfig = XansqlConfigOptions | XansqlConfigFunction;

export type XansqlDialectExcuteReturn<DATA> = {
   result: DATA[] | null,
   affectedRows: number,
   insertId: number,
}

export type ModelTableName = string
export type XansqlModelsFactory = Map<ModelTableName, Model>;