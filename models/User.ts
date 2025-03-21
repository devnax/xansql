import { increments, integer, string, timestamp } from "../src";
import Model from "../src/Model";

class UserMeta extends Model {
   static table = 'user_meta'
   static schema() {
      return {
         id: increments(),
         user_id: integer().references('users', 'id').onCascade(),
         meta_key: string().notNull(),
         meta_value: string().notNull(),
         created_at: timestamp().default('CURRENT_TIMESTAMP'),
         updated_at: timestamp().default('CURRENT_TIMESTAMP', true)
      }
   }
}

export default UserMeta