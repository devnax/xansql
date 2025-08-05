import { z, ZodBigInt, ZodBoolean, ZodDate, ZodEnum, ZodInt, ZodLiteral, ZodMap, ZodNull, ZodNullable, ZodNumber, ZodObject, ZodRecord, ZodSet, ZodString, ZodTransform, ZodTuple, ZodUnion } from "zod"
import { Callbacks, CreatedAt, UpdatedAt } from "./callbacks"

type CreatedAt = z.infer<ReturnType<typeof CreatedAt>>;
type UpdatedAt = z.infer<ReturnType<typeof UpdatedAt>>;


export type Datatypes =
   | ZodString
   | ZodBoolean
   | ZodNumber

   | ZodDate

   | ZodObject
   | ZodMap
   | ZodSet
   | ZodEnum
   | ZodNullable

   | ZodLiteral
   | ZodUnion
   | ZodRecord
   | ZodTuple
   | CreatedAt
   | UpdatedAt
   | ZodTransform


export type SchemaObject = {
   [key: string]: Datatypes | SchemaObject
}

export type SchemaConstructorArg = (t: Callbacks) => SchemaObject