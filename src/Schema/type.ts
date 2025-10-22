
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


// export type AggregatePartialArgs = {
//    column?: string
//    round?: number
//    groupBy?: string[];
//    where?: WhereArgsType;
// }

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
      beforeAggregate?: (args: AggregateArgsType) => Promise<AggregateArgsType> | AggregateArgsType;
      afterAggregate?: (result: any, args: AggregateArgsType) => Promise<any> | any;
   }
}