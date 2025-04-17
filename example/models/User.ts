import { id, relation, string, timestamp } from "../../src";
import Model from "../../src/model";
import Schema from "../../src/schema";

export interface UserData {
   id: number;
   username: string;
   email: string;
   password: string;
   created_at: Date;
   updated_at: Date;
}


export const UserSchema = new Schema({
   id: id(),
   name: string().notNull(),
   username: string().notNull(),
   email: string().notNull(),
   password: string().notNull(),
   created_at: timestamp().default('CURRENT_TIMESTAMP'),
   updated_at: timestamp().default('CURRENT_TIMESTAMP', true),
})


class User extends Model {
   table = "users"
   schema: Schema = UserSchema
}

export default User