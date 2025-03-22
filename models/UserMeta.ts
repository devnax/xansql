import { increments, integer, relation, string, timestamp } from "../src";
import Model from "../src/model";
import { UserData } from "./User";

export interface UserMetaData {
   id: number;
   user_id: number;
   user: UserData;
   meta_key: string;
   meta_value: string;
   created_at: Date;
   updated_at: Date;
}

class UserMeta extends Model<UserMetaData> {
   table = 'user_metas'
   schema() {
      return {
         id: increments(),
         user_id: integer().references('users', 'id').onCascade(),
         user: relation('user_id'),
         meta_key: string().notNull(),
         meta_value: string().notNull(),
         created_at: timestamp().default('CURRENT_TIMESTAMP'),
         updated_at: timestamp().default('CURRENT_TIMESTAMP', true)
      }
   }

}

export default UserMeta