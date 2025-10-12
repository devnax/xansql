
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

export interface WhereArgsType {
   [column: string]: WhereArgsTypeValue | WhereArgsTypeValue[];
}

export type LimitArgsType = {
   take?: number;
   skip?: number;
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
   | any[]

export type DataArgsType = {
   [column: string]: DataValue | DataArgsType[] | DataArgsType;
}

export type SelectArgsType = {
   [column: string]: boolean | FindArgsType
}

export type AggregateFunctions = "count" | "sum" | "avg" | "min" | "max"

export type AggregateArgsAggregate = {
   [column: string]: {
      [func in AggregateFunctions]?: boolean | {
         alias?: string;
         orderBy?: "asc" | "desc";
         round?: number
      }
   }
}

export type AggregateArgs = {
   groupBy?: string[];
   orderBy?: OrderByArgsType;
   limit?: LimitArgsType;
   where?: WhereArgsType;
   aggregate: AggregateArgsAggregate;
}


export type AggregatePartialArgs = {
   column?: string
   round?: number
   groupBy?: string[];
   where?: WhereArgsType;
}

export type FindArgsAggregate = {
   [foreign: string]: AggregateArgsAggregate
}

export type DistinctArgsType = string[]

export type FindArgsType = {
   distinct?: DistinctArgsType;
   where?: WhereArgsType;
   select?: SelectArgsType;
   limit?: LimitArgsType
   orderBy?: OrderByArgsType;
   aggregate?: FindArgsAggregate;
}

export type CreateArgs = {
   data: DataArgsType | DataArgsType[];
   select?: SelectArgsType;
}

export type UpdateDataRelationArgs = {
   create?: {
      data: DataArgsType | DataArgsType[];
   }
   update?: {
      data: DataArgsType | DataArgsType[];
      where: WhereArgsType;
   }
   delete?: {
      where: WhereArgsType;
   }
   upsert?: {
      where: WhereArgsType;
      data: DataArgsType;
   }
}

export type UpdateDataArgsType = {
   [column: string]: DataValue | UpdateDataRelationArgs;
}

export type UpdateArgs = {
   data: UpdateDataArgsType;
   where: WhereArgsType;
   select?: SelectArgsType
}

export type DeleteArgs = {
   where: WhereArgsType;
   select?: SelectArgsType;
}


export type XansqlSchemaOptions = {
   log?: boolean;
   hooks?: {
      beforeFind?: (args: FindArgsType) => Promise<FindArgsType> | FindArgsType;
      afterFind?: (result: any, args: FindArgsType) => Promise<any> | any;
      beforeCreate?: (data: DataArgsType | DataArgsType[]) => Promise<DataArgsType | DataArgsType[]> | (DataArgsType | DataArgsType[]);
      afterCreate?: (result: any, data: DataArgsType | DataArgsType[]) => Promise<any> | any;
      beforeUpdate?: (data: UpdateDataArgsType, where: WhereArgsType) => Promise<UpdateDataArgsType> | UpdateDataArgsType;
      afterUpdate?: (result: any, data: UpdateDataArgsType, where: WhereArgsType) => Promise<any> | any;
      beforeDelete?: (where: WhereArgsType) => Promise<WhereArgsType> | WhereArgsType;
      afterDelete?: (result: any, where: WhereArgsType) => Promise<any> | any;
      beforeAggregate?: (args: AggregateArgs) => Promise<AggregateArgs> | AggregateArgs;
      afterAggregate?: (result: any, args: AggregateArgs) => Promise<any> | any;
   }
}