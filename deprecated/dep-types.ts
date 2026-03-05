import { ExecuterResult, ResultData, RowObject, XansqlFileMeta } from "../core/types";
import { XqlField, XqlSchemaShape } from "../xt/types";
import XqlIDField from "../xt/fields/IDField";
import XqlSchema from "../xt/fields/Schema";
import XqlArray from "../xt/fields/Array";
import { InferValue, XVType } from "xanv";
import XqlFile from "../xt/fields/File";

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
export type WhereLogicalOperators = {
   AND?: WhereArgsType[];
   OR?: WhereArgsType[];
   NOT?: WhereArgsType[];
}

export type WhereArgsType = {
   [column: string]: WhereArgsTypeValue | WhereArgsTypeValue[];
} | WhereArgsType[] | WhereLogicalOperators

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

export type UpdateArgsType = FindArgsType & {
   data: UpdateDataArgsType;
   where: WhereArgsType;
}

export type DeleteArgsType = {
   where: WhereArgsType;
   select?: SelectArgsType;
}

export type XansqlModelHooks = {
   beforeExcute?: (sql: string) => Promise<string | void>
   afterExcute?: (result: ExecuterResult) => Promise<ExecuterResult | void>
   beforeFind?: (args: FindArgsType) => Promise<FindArgsType | void>
   afterFind?: (result: ResultData, args: FindArgsType) => Promise<ResultData | void>
   beforeCreate?: (args: CreateArgsType) => Promise<CreateArgsType | void>
   afterCreate?: (result: ResultData, args: CreateArgsType) => Promise<ResultData | void>
   beforeUpdate?: (args: UpdateArgsType) => Promise<UpdateArgsType | void>
   afterUpdate?: (result: ResultData, args: UpdateArgsType) => Promise<ResultData | void>
   beforeDelete?: (args: DeleteArgsType) => Promise<DeleteArgsType | void>
   afterDelete?: (result: ResultData, args: DeleteArgsType) => Promise<ResultData | void>
   beforeAggregate?: (args: AggregateArgsType) => Promise<AggregateArgsType | void>
   afterAggregate?: (result: ResultData, args: AggregateArgsType) => Promise<ResultData | void>
   transform?: (row: RowObject) => Promise<RowObject | void>
}




// NEW =============================================================================


type Simplify<T> = T extends object ? { [K in keyof T]: T[K] } : T

export type IsOptional<T extends XVType<any>> =
   T["meta"] extends { nullable: true } ? true :
   T["meta"] extends { optional: true } ? true :
   T["meta"] extends { default: any } ? true :
   false

export type InferObject<T extends Record<string, XVType<any>>> =
   { [K in keyof T as IsOptional<T[K]> extends true ? never : K]: InferValue<T[K]> } &
   { [K in keyof T as IsOptional<T[K]> extends true ? K : never]?: InferValue<T[K]> }

export type Infer<T> =
   T extends Record<string, XVType<any>> ? Simplify<InferObject<T>> :
   T extends XVType<any> ? InferValue<T> : never


export type IsIDField<T extends XqlField> = T extends XqlIDField ? true : false
export type IsRelation<T extends XqlField> = T extends XqlSchema<any, any> ? true : T extends XqlArray<XqlSchema<any, any>> ? true : false;
export type IsSchema<T extends XqlField> = T extends XqlSchema<any, any> ? true : false;
export type IsArraySchema<T extends XqlField> = T extends XqlArray<XqlSchema<any, any>> ? true : false;

// SELECT Args ==========================
export type SelectRelationArgs = boolean | {
   select: {
      [column: string]: boolean | SelectRelationArgs
   }
}

export type SelectArgs<T extends XqlSchemaShape> = {
   [K in keyof T]?: IsRelation<T[K]> extends true ? SelectRelationArgs : boolean
}


// Create Args ==================================
export type IsCreateAutoFill<T extends XqlField> =
   IsIDField<T> extends true ? true :
   T['meta'] extends { create: true } ? true :
   T['meta'] extends { update: true } ? true : false

export type CreateRelationDataArgs = {
   [key: string]: any | CreateRelationDataArgs
}

export type CreateDataArgsObject<S extends XqlSchemaShape> = {
   [K in keyof S as
   IsRelation<S[K]> extends true ? never :
   IsCreateAutoFill<S[K]> extends true ? never :
   K]: S[K]
}

export type CreateDataArgs<S extends XqlSchemaShape> =
   Infer<CreateDataArgsObject<S>> &
   {
      [K in keyof S as
      IsArraySchema<S[K]> extends true ? K :
      never]?: CreateRelationDataArgs | CreateRelationDataArgs[]
   } &
   {
      [K in keyof S as
      IsSchema<S[K]> extends true ? K :
      never]?: number
   }

export type CreateArgs<S extends XqlSchemaShape> = {
   data: Simplify<CreateDataArgs<S>> | Simplify<CreateDataArgs<S>>[]
   select?: Simplify<SelectArgs<S>>
}


// Where Args ===============


export interface WhereArgsSubCondition<V> {
   equals?: V;
   not?: V;
   lt?: V;
   lte?: V;
   gt?: V;
   gte?: V;
   in?: (V)[];
   notIn?: (V)[];
   between?: [V, V];
   notBetween?: [V, V];
   contains?: V;
   notContains?: V;
   startsWith?: V;
   endsWith?: V;
   isNull?: boolean;
   isNotNull?: boolean;
   isEmpty?: boolean;
   isNotEmpty?: boolean;
   isTrue?: boolean;
   isFalse?: boolean;
}

export type WhereRelationArgsValue = string | number | boolean | null | Date
export type WhereRelationArgs = {
   [column: string]: WhereRelationArgsValue | WhereArgsSubCondition<WhereRelationArgsValue> | WhereArgsSubCondition<WhereRelationArgsValue>[]
}

export type WhereArgsRealtionFields<S extends XqlSchemaShape> = {
   [K in keyof S as IsRelation<S[K]> extends true ? K : never]?:
   WhereRelationArgs |
   WhereRelationArgs[] |
   {
      AND?: WhereRelationArgs[],
      OR?: WhereRelationArgs[],
      NOT?: WhereRelationArgs[],
   }
}


export type WhereArgsFields<S extends XqlSchemaShape> = {
   [K in keyof S as IsRelation<S[K]> extends true ? never : K]?:
   Infer<S[K]> |
   WhereArgsSubCondition<Infer<S[K]>> |
   WhereArgsSubCondition<Infer<S[K]>>[]
}

export type WhereArgsFull<S extends XqlSchemaShape> = Simplify<WhereArgsFields<S> & WhereArgsRealtionFields<S> & {
   AND?: WhereArgsFields<S>[],
   OR?: WhereArgsFields<S>[],
   NOT?: WhereArgsFields<S>[],
}>

export type WhereArgs<S extends XqlSchemaShape> = WhereArgsFull<S> | WhereArgsFull<S>[]

// Distinct Args ======================
export type DistinctArgs<S extends XqlSchemaShape> = (keyof S)[]

// Limit Args =========================
export type LimitArgs = "all" | {
   take?: number;
   skip?: number;
}

// Order Args =========================
export type OrderByArgs<S extends XqlSchemaShape> = {
   [column in keyof S]?: "asc" | "desc";
}


// Aggregate Args
export type AggregateArgsFunctions = "count" | "sum" | "avg" | "min" | "max"
export type AggregateArgsValue = {
   [func in AggregateFunctions]?: boolean | {
      orderBy?: "asc" | "desc";
      round?: number;
      distinct?: boolean;
   }
}
export type AggregateGroupByArgs<S extends XqlSchemaShape> = (keyof S)[]

export type AggregateSelectArgs<S extends XqlSchemaShape> = Simplify<{
   [column in keyof S as IsRelation<S[column]> extends true ? never : column]?: AggregateArgsValue
}>


export type AggregateArgs<S extends XqlSchemaShape> = {
   groupBy?: AggregateGroupByArgs<S>;
   orderBy?: OrderByArgs<S>;
   limit?: LimitArgs;
   where?: WhereArgs<S>;
   select: AggregateSelectArgs<S>
}

export type AggregateResult<AS extends AggregateSelectArgs<any>> = Simplify<{
   [Col in keyof AS]: {
      [Fn in keyof AS[Col]]: number
   }
}>



// Find Aggregate Args ===============
export type FindAggregateArgs<S extends XqlSchemaShape> = {
   [K in keyof S as IsArraySchema<S[K]> extends true ? K : never]?: {
      [column: string]: AggregateArgsValue
   }
}


// Find Args
export type FindArgs<S extends XqlSchemaShape> = {
   distinct?: DistinctArgs<S>;
   where?: WhereArgs<S>
   select?: SelectArgs<S>
   limit?: LimitArgs
   orderBy?: OrderByArgs<S>;
   aggregate?: Simplify<FindAggregateArgs<S>>;
}

// Result Args ============

export type ResultArgsFields<S extends XqlSchemaShape, SA extends SelectArgs<any>> = {
   [K in keyof S as K extends keyof SA ? (IsRelation<S[K]> extends true ? never : K) : never]: S[K] extends XqlFile ? XansqlFileMeta : Infer<S[K]>
}

export type ResultRelationFields<S extends XqlSchemaShape, SA extends SelectArgs<any>> = {
   [K in keyof S as K extends keyof SA ? (IsSchema<S[K]> extends true ? K : never) : never]: true
}

export type ResultArgsSchemaFields<S extends XqlSchemaShape, SA extends SelectArgs<any>> = {
   [K in keyof S as K extends keyof SA ? (IsSchema<S[K]> extends true ? K : never) : never]: {
      [column: string]: any
   }
}

export type ResultArgsArraySchemaFields<S extends XqlSchemaShape, SA extends SelectArgs<any>> = {
   [K in keyof S as K extends keyof SA ? (IsArraySchema<S[K]> extends true ? K : never) : never]: ({
      [column: string]: any
   })[]
}

export type ResultFullArsg<S extends XqlSchemaShape, SA extends SelectArgs<any>> =
   Simplify<ResultArgsFields<S, SA>> &
   Simplify<ResultArgsArraySchemaFields<S, SA>> &
   Simplify<ResultArgsSchemaFields<S, SA>>


type ResultDefaultSelect<S extends XqlSchemaShape> = {
   [K in keyof S as IsRelation<S[K]> extends true ? never : K]: true
}

type IsEmptyObject<T> =
   T extends object
   ? keyof T extends never
   ? true
   : false
   : false

export type ResultArgs<S extends XqlSchemaShape, SA extends SelectArgs<any> | unknown> =
   Simplify<ResultFullArsg<S,
      SA extends SelectArgs<any> ? (
         IsEmptyObject<Omit<SA, keyof ResultRelationFields<S, SA>>> extends true ? ResultDefaultSelect<S> : SA & {
            [IDCol in keyof S as S[IDCol] extends XqlIDField ? IDCol : never]: true
         }
      ) : ResultDefaultSelect<S>
   >>


// Delete Args =======================
export type DeleteArgs<S extends XqlSchemaShape> = {
   where: WhereArgs<S>;
   select?: SelectArgs<S>;
}


// Update Args =======================


export type UpdateRelationDataArgs = {
   [key: string]: any | UpdateRelationDataArgs
}

export type UpdateDataFieldArgs<S extends XqlSchemaShape> = {
   [K in keyof S as IsRelation<S[K]> extends true ? never : K]?: Infer<S[K]>
}

export type UpdateDataScheamArrayArgs<S extends XqlSchemaShape> = {
   [K in keyof S as IsRelation<S[K]> extends true ? K : never]?: {
      create?: {
         data: CreateRelationDataArgs
      };
      update?: {
         data: UpdateRelationDataArgs;
         where: WhereRelationArgs
      }
      delete?: {
         where: WhereRelationArgs
      }
      upsert?: {
         where: WhereRelationArgs
         create: CreateRelationDataArgs;
         update: UpdateRelationDataArgs;
      }
   }
}

export type UpdateDataArgs<S extends XqlSchemaShape> =
   UpdateDataFieldArgs<S> |
   UpdateDataScheamArrayArgs<S>

export type UpdateArgs<S extends XqlSchemaShape> = FindArgs<S> & {
   data: Simplify<UpdateDataArgs<S>>;
}



