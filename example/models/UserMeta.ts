import { id, integer, relation, string, timestamp } from "../../src";
import Model from "../../src/model";
import Schema from "../../src/Schema";
import { UserData, UserSchema } from "./User";

export interface UserMetaData {
   id: number;
   user_id: number;
   user: UserData;
   meta_key: string;
   meta_value: string;
   created_at: Date;
   updated_at: Date;
}

const UserMetaSchema = new Schema({
   id: id(),
   user_id: integer().references('users', 'id').onDelete('CASCADE'),
   user: relation('user_id'),
   meta_key: string().index(),
   meta_value: string().index(),
   created_at: timestamp().default('CURRENT_TIMESTAMP'),
   updated_at: timestamp().default('CURRENT_TIMESTAMP', true),
})

UserSchema.add({
   metas: relation('user_id', 'user_metas')
})

class UserMeta extends Model {
   table = "user_metas"
   schema: Schema = UserMetaSchema
}

export default UserMeta


