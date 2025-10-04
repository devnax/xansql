
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

export type WhereArgsValue = string | number | boolean | WhereSubCondition | null | Date | WhereArgs

export interface WhereArgs {
   [column: string]: WhereArgsValue | WhereArgsValue[];
}

export type LimitArgs = {
   take?: number;
   skip?: number;
}

export type OrderByArgs = {
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

export type DataArgs = {
   [column: string]: DataValue | DataArgs[] | DataArgs;
}

export type SelectArgs = {
   [column: string]: boolean | FindArgs
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
   orderBy?: OrderByArgs;
   limit?: LimitArgs;
   groupBy?: string[];
   where?: WhereArgs;
   aggregate: AggregateArgsAggregate;
}


export type AggregatePartialArgs = {
   column?: string
   round?: number
   groupBy?: string[];
   where?: WhereArgs;
}

export type FindArgsAggregate = {
   [foreign: string]: AggregateArgsAggregate
}

export type FindArgs = {
   distinct?: string[];
   where?: WhereArgs;
   select?: SelectArgs;
   limit?: LimitArgs
   orderBy?: OrderByArgs;
   aggregate?: FindArgsAggregate;
   cache?: boolean;
}

export type CreateArgs = {
   data: DataArgs | DataArgs[];
   select?: SelectArgs;
}

export type UpdateDataRelationArgs = {
   data: UpdateDataArgs;
   where?: WhereArgs;
}

export type UpdateDataArgs = {
   [column: string]: DataValue | UpdateDataRelationArgs;
}

export type UpdateArgs = {
   data: UpdateDataArgs;
   where: WhereArgs;
   select?: SelectArgs
}

export type DeleteArgs = {
   where: WhereArgs;
   select?: SelectArgs;
}


export type XansqlSchemaOptions = {
   log?: boolean;
   hooks?: {
      beforeFind?: (args: FindArgs) => Promise<FindArgs> | FindArgs;
      afterFind?: (result: any, args: FindArgs) => Promise<any> | any;
      beforeCreate?: (data: DataArgs | DataArgs[]) => Promise<DataArgs | DataArgs[]> | (DataArgs | DataArgs[]);
      afterCreate?: (result: any, data: DataArgs | DataArgs[]) => Promise<any> | any;
      beforeUpdate?: (data: UpdateDataArgs, where: WhereArgs) => Promise<UpdateDataArgs> | UpdateDataArgs;
      afterUpdate?: (result: any, data: UpdateDataArgs, where: WhereArgs) => Promise<any> | any;
      beforeDelete?: (where: WhereArgs) => Promise<WhereArgs> | WhereArgs;
      afterDelete?: (result: any, where: WhereArgs) => Promise<any> | any;
      beforeAggregate?: (args: AggregateArgs) => Promise<AggregateArgs> | AggregateArgs;
      afterAggregate?: (result: any, args: AggregateArgs) => Promise<any> | any;
   }
}