import { id, relation, string, timestamp } from "../../src";
import Model from "../../src/model";
import Schema from "../../src/schema";

export interface UserData {
   id?: number;
   name: string;
   email: string;
   password: string;
   username?: string;
   created_at?: Date;
   updated_at?: Date;
}


export const UserSchema = new Schema({
   id: id(),
   name: string(),
   email: string(),
   password: string(),
   username: string().default(""),
   created_at: timestamp().default('CURRENT_TIMESTAMP'),
   updated_at: timestamp().default('CURRENT_TIMESTAMP', true),
})


class User extends Model<UserData> {
   table = "users"
   schema: Schema = UserSchema
}

export default User