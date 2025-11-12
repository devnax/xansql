
export interface WhereSubCondition {
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
}

export type WhereArgsTypeValue = string | number | boolean | WhereSubCondition | null | Date | WhereArgsType

export type WhereArgsType = {
   [column: string]: WhereArgsTypeValue | WhereArgsTypeValue[];
} | WhereArgsType[];

export type LimitArgsType = "all" | {
   take?: number;
   skip?: number;
   sql?: string;
}

export type OrderByArgsType = {
   [column: string]: "asc" | "desc";
}

export type DataValue =
   | string
   | number
   | boolean
   | Date
   | null
   | Map<any, any>
   | Set<any>
   | File
   | Record<string | number, any>

export type DataArgsType = {
   [column: string]: DataValue | DataArgsType[] | DataArgsType;
}

export type AggregateFunctions = "count" | "sum" | "avg" | "min" | "max"
export type AggregateSelectArgsColumnType = {
   [func in AggregateFunctions]?: boolean | {
      alias?: string;
      orderBy?: "asc" | "desc";
      round?: number;
      distinct?: boolean;
   }
}

export type AggregateSelectArgsType = {
   [column: string]: AggregateSelectArgsColumnType | AggregateArgsType
}

export type AggregateArgsType = {
   groupBy?: string[];
   orderBy?: OrderByArgsType;
   limit?: LimitArgsType;
   where?: WhereArgsType;
   select: AggregateSelectArgsType;
}

export type FindArgsAggregate = {
   [foreign: string]: AggregateSelectArgsType
}

export type DistinctArgsType = string[]

export type SelectArgsType = {
   [column: string]: boolean | FindArgsType
}

export type FindArgsType = {
   distinct?: DistinctArgsType;
   where?: WhereArgsType;
   select?: SelectArgsType;
   limit?: LimitArgsType
   orderBy?: OrderByArgsType;
   aggregate?: FindArgsAggregate;
}

export type CreateArgsType = {
   data: DataArgsType | DataArgsType[];
   select?: SelectArgsType;
}

export type UpdateDataRelationArgs = {
   create?: {
      data: DataArgsType | DataArgsType[];
   }
   update?: {
      data: DataArgsType;
      where: WhereArgsType;
   }
   delete?: {
      where: WhereArgsType;
   }
   upsert?: {
      where: WhereArgsType;
      create: DataArgsType;
      update: DataArgsType;
   }
}

export type UpdateDataArgsType = {
   [column: string]: DataValue | UpdateDataRelationArgs;
}

export type UpdateArgsType = {
   data: UpdateDataArgsType;
   where: WhereArgsType;
   select?: SelectArgsType
}

export type DeleteArgsType = {
   where: WhereArgsType;
   select?: SelectArgsType;
}
