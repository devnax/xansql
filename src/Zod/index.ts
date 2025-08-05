import Schema from "./Schema";
import { z } from "zod";
const time = z.date().default(() => new Date());

export {
   Schema,
}


const userSchema = new Schema("users", (t) => ({
   id: t.string(),
   name: t.string(),
   email: t.string(),
   u: t.updatedAt(),
}));

console.log(userSchema);
