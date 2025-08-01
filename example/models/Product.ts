import { id, relation, string, timestamp } from "../../src";
import Model from "../../src/model";
import Schema, { integer } from "../../src/Schema";
import { UserSchema } from "./User";


export const ProductSchema = new Schema({
   id: id(),
   name: string().index(),
   price: string().index(),
   description: string().null(),
   user_id: integer().references('users', 'id').onDelete('CASCADE'),
   user: relation("user_id"),
   created_at: timestamp().default('CURRENT_TIMESTAMP'),
   updated_at: timestamp().default('CURRENT_TIMESTAMP', true),
})

UserSchema.add({
   products: relation("user_id", "products")
})


class Product extends Model {
   table = "products"
   schema: Schema = ProductSchema
}

export default Product