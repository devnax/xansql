import Dialect from "./Dialect";
import Model from "./Model";

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

// QUERY

interface WhereCondition {
   [key: string]: string | number | boolean | WhereSubCondition | FindArgs;
}

interface WhereSubCondition {
   equals?: string | number | boolean;
   not?: string | number | boolean;
   lt?: string | number;
   lte?: string | number;
   gt?: string | number;
   gte?: string | number;
   in?: (string | number)[];
   notIn?: (string | number)[];
   between?: [string | number, string | number];
   notBetween?: [string | number, string | number];
   contains?: string;
   notContains?: string;
   startsWith?: string;
   endsWith?: string;
   isNull?: boolean;
   isNotNull?: boolean;
   isEmpty?: boolean;
   isNotEmpty?: boolean;
   isTrue?: boolean;
   isFalse?: boolean;
   like?: string;
   notLike?: string;
   matches?: string;
}

export type SelectClause = string[]

export type FindArgs = {
   take?: number;
   skip?: number;
   orderBy?: {
      [key: string]: "asc" | "desc";
   };
   where?: WhereCondition;
   select?: SelectClause;
}

export type DataClause = {
   [key: string]: string | number | boolean | Date | null | DataClause;
}

export type UpdateArgs = {
   data?: DataClause;
   where?: WhereCondition;
   select?: SelectClause;
}

export type DeleteArgs = {
   where?: WhereCondition;
   select?: SelectClause;
}

export type CreateArgValue = string | number | boolean | null

export type CreateArgsData = {
   [field: string]: CreateArgValue | CreateArgs;
}

export type CreateArgs = {
   data: CreateArgsData | CreateArgsData[];
   select?: {
      [field: string]: boolean;
   };
}
