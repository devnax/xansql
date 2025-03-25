import Dialect from "./Dialect";
import Model from "./Model";

export type XansqlConfigOptions = {
   connection: string | {
      host: string,
      user: string,
      password: string,
      database: string,
      port: number;
   };
   cache?: boolean;
}

export type XansqlConfigFunction = () => (XansqlConfigOptions | string);

export type XansqlConfig = XansqlConfigOptions | string | XansqlConfigFunction;

export type XansqlDialectName = string;
export type XansqlDialectsFactory = Map<XansqlDialectName, Dialect>;
export type XansqlDialectExcuteReturn<R> = {
   rows: R[],
   affectedRows: number,
   insertId: number,
}

export type ModelTableName = string
export type XansqlModelsFactory = Map<ModelTableName, Model>;