import { id, integer, relation, string, timestamp } from "../../src";
import Model from "../../src/Model";
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

class UserMeta extends Model {
   table = 'user_metas'
   schema() {
      return {
         id: id(),
         user_id: integer().references('users', 'id').onCascade(),
         user: relation('user_id'),
         key: string().notNull(),
         value: string().notNull(),
         created_at: timestamp().default('CURRENT_TIMESTAMP'),
         updated_at: timestamp().default('CURRENT_TIMESTAMP', true)
      }
   }

}

export default UserMeta