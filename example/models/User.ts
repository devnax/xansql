import { id, relation, string, timestamp } from "../../src";
import Model from "../../src/model";

export interface UserData {
   id: number;
   username: string;
   email: string;
   password: string;
   created_at: Date;
   updated_at: Date;
}

class User extends Model {
   table = 'users'
   schema() {
      return {
         id: id(),
         name: string().notNull(),
         email: string().notNull(),
         password: string().notNull(),
         created_at: timestamp().default('CURRENT_TIMESTAMP'),
         updated_at: timestamp().default('CURRENT_TIMESTAMP', true),
         user_metas: relation('id', 'user_metas'),
      }
   }

}

export default User