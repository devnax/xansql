import { z, ZodDate, ZodDefault } from "zod";


export const CreatedAt = () => {
   return z.date().default(() => new Date())
};

export const UpdatedAt = () => {
   return z.date().default(() => new Date()).transform((val) => val);
};



const callbacks = {
   string: z.string,
   number: z.number,
   boolean: z.boolean,
   date: z.date,
   object: z.object,
   map: z.map,
   set: z.set,
   enum: z.enum,
   literal: z.literal,
   union: z.union,
   record: z.record,
   tuple: z.tuple,

   createdAt: CreatedAt,
   updatedAt: UpdatedAt
}




export default callbacks;
export type Callbacks = typeof callbacks;
export type CallbackName = keyof Callbacks;