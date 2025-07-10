import Model from "../../model";
import Schema, { id, string, timestamp } from "../../schema";

const CacheSchema = new Schema({
   id: id(),
   cache_key: string().unique(),
   cache_value: string(),
   expire: string().default('0'),
   created_at: timestamp().default('CURRENT_TIMESTAMP'),
})

class Cache extends Model {
   table = "cache"
   schema: Schema = CacheSchema
}
export default Cache