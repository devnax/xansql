import { Infer, XVType } from "xanv"
import Model from "."
import XqlRelationMany from "../xt/fields/RelationMany"
import XqlRelationOne from "../xt/fields/RelationOne"
import { XqlField } from "../xt/types"
import XqlIDField from "../xt/fields/IDField"
import ModelWhere from "./ModelWhere"
import { ExecuterResult } from "../core/types"

export type ModelRowObject<S extends SchemaShape> = {
   [column in keyof S as S[column] extends XqlRelationMany<any> ? never : column]: S[column]
}

export type ModelHooks<S extends SchemaShape = any> = {
   beforeExcute?: (sql: string) => Promise<string | void>
   afterExcute?: (result: ExecuterResult) => Promise<ExecuterResult | void>
   beforeFind?: (args: FindArgs<S>) => Promise<FindArgs<S> | void>
   afterFind?: (results: FindResult<SchemaShape, S>, args: FindArgs<S>) => Promise<FindResult<SchemaShape, S> | void>
   beforeCreate?: (args: CreateArgs<S>) => Promise<CreateArgs<S> | void>
   afterCreate?: (result: FindResult<SchemaShape, S>, args: CreateArgs<S>) => Promise<FindResult<SchemaShape, S> | void>
   beforeUpdate?: (args: UpdateArgs<S>) => Promise<UpdateArgs<S> | void>
   afterUpdate?: (result: FindResult<SchemaShape, S>, args: UpdateArgs<S>) => Promise<FindResult<SchemaShape, S> | void>
   beforeDelete?: (args: DeleteArgs<S>) => Promise<DeleteArgs<S> | void>
   afterDelete?: (result: FindResult<SchemaShape, S>, args: DeleteArgs<S>) => Promise<FindResult<SchemaShape, S> | void>
   beforeAggregate?: (args: AggregateArgs<S, any>) => Promise<AggregateArgs<S, any> | void>
   afterAggregate?: (result: FindResult<SchemaShape, S>, args: AggregateArgs<S, any>) => Promise<FindResult<SchemaShape, S> | void>
}

export type ModelOptions<S extends SchemaShape = any> = {
   hooks: ModelHooks<S>,
   transform?: (row: ModelRowObject<S>) => Promise<ModelRowObject<S> | void>;
   softDelete?: {
      field: String;
      retentionDays?: number;
   }
}

export type ExactArgs<T, Shape> =
   T extends object
   ? Shape extends object
   ? Exclude<keyof T, keyof Shape> extends never
   ? {
      [K in keyof T]:
      K extends keyof Shape
      ? K extends "where"   // 👈 stop recursion here
      ? T[K]
      : T[K] extends object
      ? Shape[K] extends object
      ? ExactArgs<T[K], Shape[K]>
      : T[K]
      : T[K]
      : never
   }
   : never
   : never
   : T;

export type SchemaShape = Record<string, XqlField>
export type ModelClass<M extends Model<any>> = new (...args: any[]) => M
export type Normalize<T> = T extends object ? { [K in keyof T]: T[K] } : T

export type SchemaAllColumns<S extends SchemaShape> = {
   [column in keyof S as S[column] extends XqlRelationMany<any> ? never : column]: S[column]
}

export type IsRelationField<F extends XqlField> = F extends { isRelation: true } ? true : false
export type IsRelationOne<F extends XqlField> = F extends XqlRelationOne<any> ? true : false
export type IsRelationMany<F extends XqlField> = F extends XqlRelationMany<any> ? true : false




export type LimitArgs = {
   take: number;
   skip?: number;
}

export type OrderByArgs<S extends SchemaShape> = Normalize<{
   [C in keyof S as S[C] extends XqlRelationMany<any> ? never : C]?: "asc" | "desc";
}>


// WHERE 
type WhereSubConditionComparableArgs<F extends XqlField> = F extends XVType<number> ? {
   lt?: number | Date
   lte?: number | Date
   gt?: number | Date
   gte?: number | Date
   between?: [number | Date, number | Date]
} : {}

type WhereSubConditionStringArgs<F extends XqlField> = F extends XVType<string> ? {
   contains?: string
   startsWith?: string
   endsWith?: string
   mode?: "default" | "insensitive"
} : {}

export type WhereSubConditionArgs<F extends XqlField> =
   {
      is?: InferWhereValue<F> | null
      not?: InferWhereValue<F> | null | WhereSubConditionArgs<F> | WhereSubConditionArgs<F>[]

      in?: readonly InferWhereValue<F>[] | ModelWhere<any>
      notIn?: readonly InferWhereValue<F>[] | ModelWhere<any>
   }
   & WhereSubConditionComparableArgs<F>
   & WhereSubConditionStringArgs<F>


export type InferWhereValue<F extends XVType<any>> = F extends { _type: infer R } ? R : never
export type WhereColumnArgs<F extends XqlField> = InferWhereValue<F> | WhereSubConditionArgs<F> | WhereSubConditionArgs<F>[];

type WhereObject<S extends SchemaShape> = Normalize<{
   [C in keyof S]?:
   S[C] extends { type: "relation-many", schema: SchemaShape } ? (
      WhereObject<S[C]['schema']> | WhereObject<S[C]['schema']>[]
   ) :
   S[C] extends { type: "relation-one", schema: SchemaShape } ? (
      WhereSubConditionArgs<S[C]> | WhereObject<S[C]['schema']> | (WhereSubConditionArgs<S[C]> | WhereObject<S[C]['schema']>)[]
   ) :
   WhereColumnArgs<S[C]>
}>

export type WhereArgs<S extends SchemaShape> = WhereObject<S> | WhereObject<S>[]

// SELECT ARGS
export type SelectArgs<S extends SchemaShape = SchemaShape> = Normalize<{
   [C in keyof S]?: S[C] extends { isRelation: true; schema: SchemaShape } ? boolean | Normalize<FindArgs<S[C]['schema']>> : boolean
}>


// AGGREGATE ARGS

export type AggregateFunctions = "count" | "sum" | "avg" | "min" | "max"
export type AggregateArgsValue = {
   [func in AggregateFunctions]?: boolean | {
      alias?: string;
      orderBy?: "asc" | "desc";
      round?: number;
      distinct?: boolean;
   }
}

export type AggregateSelectArgs<S extends SchemaShape> = {
   [C in keyof S  as S[C] extends { isRelation: true } ? never : C]?: AggregateArgsValue
}

export type AggregateGroupByArgs<S extends SchemaShape> = (keyof SchemaAllColumns<S>)[]

export type AggregateOrderBy<G extends AggregateGroupByArgs<any> | undefined> =
   G extends Array<keyof any>
   ? { [K in G[number]]?: "asc" | "desc" }
   : never;

export type AggregateArgs<S extends SchemaShape, T extends AggregateArgs<any, any>> = {
   groupBy?: AggregateGroupByArgs<S>;
   orderBy?: AggregateOrderBy<T['groupBy']>;
   limit?: LimitArgs;
   where?: WhereArgs<S>;
   select: AggregateSelectArgs<S>;
   debug?: boolean
}

// FIND ARGS
export type FindAggregateArgs<S extends SchemaShape> = Normalize<{
   [K in keyof S as S[K] extends { type: "relation-many", schema: SchemaShape } ? K : never]?: S[K] extends { type: "relation-many", schema: SchemaShape } ? Normalize<AggregateSelectArgs<S[K]["schema"]>> : never
}>


// FIND ARGS
export type FindArgs<S extends SchemaShape> = {
   distinct?: boolean;
   where?: WhereArgs<S>
   select?: SelectArgs<S>
   limit?: LimitArgs
   orderBy?: OrderByArgs<S>;
   aggregate?: FindAggregateArgs<S>;
   debug?: boolean
}

// Fix FindResult so missing select returns full shape
export type FindResultFullSchema<S extends SchemaShape> = {
   [K in keyof S as S[K] extends { isRelation: true } ? never : K]: Infer<S[K]>
}

export type FindResultColumnMap<T extends FindArgs<any>, S extends SchemaShape> = {
   [K in keyof T['select'] & keyof S as T['select'][K] extends any ?
   (
      S[K] extends { isRelation: true } ? never : K
   ) :
   never]: true
}

export type FindResultMap<T extends FindArgs<any>, S extends SchemaShape> = {
   [C in keyof S as S[C] extends XqlIDField ? C : never]: number
} & {
   [K in keyof T['select'] & keyof S as T['select'][K] extends any ? K : never]: (
      S[K] extends { type: "relation-many", schema: SchemaShape } ? (
         T['select'][K] extends FindArgs<any> ? (
            keyof T['select'][K] extends never ? Normalize<FindResultFullSchema<S[K]['schema']>> : FindResult<T["select"][K], S[K]['schema']>[]
         ) : Normalize<FindResultFullSchema<S[K]['schema']>>[]
      ) :
      S[K] extends { type: "relation-one", schema: SchemaShape } ? (
         T['select'][K] extends FindArgs<any> ? (
            keyof T['select'][K] extends never ? Normalize<FindResultFullSchema<S[K]['schema']>> : FindResult<T["select"][K], S[K]['schema']>
         ) : Normalize<FindResultFullSchema<S[K]['schema']>>
      ) :
      Infer<S[K]>
   )
}

export type FindResult<T extends FindArgs<any>, S extends SchemaShape> =
   Normalize<keyof T['select'] extends never ? Normalize<FindResultFullSchema<S>> :
      keyof FindResultColumnMap<T, S> extends never ? Normalize<FindResultFullSchema<S>> & Normalize<FindResultMap<T, S>> :
      Normalize<FindResultMap<T, S>>>



// CREATE ARGS
export type CreateDataValue<F extends XqlField> =
   F extends XqlRelationOne<any> ? (
      F extends { meta: { nullable: true } } ? number | null : number
   ) :
   F extends { type: "relation-many", schema: SchemaShape, targetColumn: string } ? CreateArgs<Omit<F['schema'], F['targetColumn']>>['data'] :
   Infer<F>

export type CreateDataArgs<S extends SchemaShape> = Normalize<{
   [
   C in keyof S as
   S[C] extends XqlIDField ? never :
   S[C] extends XqlRelationMany<any> ? never :
   S[C]['meta'] extends { nullable: true } ? never :
   S[C]['meta'] extends { default: any } ? never :
   S[C]['meta'] extends { createdAt: true } ? never :
   S[C]['meta'] extends { updatedAt: true } ? never : C
   ]: CreateDataValue<S[C]>
} & {
   [
   C in keyof S as
   S[C] extends XqlRelationMany<any> ? C :
   S[C]['meta'] extends { nullable: true } ? C :
   S[C]['meta'] extends { default: any } ? C :
   never
   ]?: CreateDataValue<S[C]>
}>

export type CreateArgs<S extends SchemaShape> = {
   data: CreateDataArgs<S> | CreateDataArgs<S>[];
   select?: SelectArgs<S>;
   useTransection?: boolean;
   debug?: boolean
}


// UPDATE ARGS
export type UpdateRelationArgs<S extends SchemaShape> = Normalize<{
   data: UpdateDataArgs<S>;
   where?: Normalize<WhereArgs<S>>
}>
export type UpdateDataValue<F extends XqlField> =
   F extends XqlRelationOne<any> ? (
      F extends { meta: { nullable: true } } ? number | null : number
   ) :
   F extends { type: "relation-many", schema: SchemaShape } ? UpdateRelationArgs<F['schema']> :
   Infer<F>

export type UpdateDataArgs<S extends SchemaShape> = Normalize<{
   [
   C in keyof S as
   S[C] extends XqlIDField ? never :
   S[C]['meta'] extends { create: true } ? never :
   S[C]['meta'] extends { update: true } ? never : C
   ]?: UpdateDataValue<S[C]>
}>

export type UpdateArgs<S extends SchemaShape> = Normalize<{
   data: UpdateDataArgs<S>;
   where: Normalize<WhereArgs<S>>;
   useTransection?: boolean;
   debug?: boolean
}>

// UPSERT
export type UpsertArgs<S extends SchemaShape> = {
   create: CreateDataArgs<S>;
   update: UpdateDataArgs<S>;
   where: WhereArgs<S>;
   useTransection?: boolean;
   debug?: boolean
}

// DELETE ARGS
export type DeleteArgs<S extends SchemaShape> = {
   where: WhereArgs<S>;
   select?: SelectArgs<S>;
   useTransection?: boolean;
   debug?: boolean
}


export type PaginateArgs<S extends SchemaShape> = Omit<FindArgs<S>, "limit"> & {
   page: number,
   perpage?: number
}