import Dialect from "./Dialect";
import Model from "./model";

export type XansqlConfigOptions = {
   dialect?: XansqlDialectDriver;
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

export const DialectDrivers = ["mysql", "sqlite", "postgres"] as const

export type XansqlDialectDriver = typeof DialectDrivers[number];
export type XansqlDialectsFactory = Map<XansqlDialectDriver, Dialect>;
export type XansqlDialectExcuteReturn<R> = {
   result: R[],
   affectedRows: number,
   insertId: number,
}

export type ModelTableName = string
export type XansqlModelsFactory = Map<ModelTableName, Model>;

export type JsonQueryOption = {
   select: [],
   where: {},
   relations: { [table_name: string]: JsonQueryOption }
}