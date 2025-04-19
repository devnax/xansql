import { id, relation, string, timestamp } from "../../src";
import Model from "../../src/model";
import Schema, { integer } from "../../src/schema";
import { ProductSchema } from "./Product";


export const categoriesSchema = new Schema({
   id: id(),
   name: string(),
   description: string().null(),
   product_id: integer().references('products', 'id').onDelete('CASCADE').onUpdate('CASCADE'),
   product: relation("product_id"),
   created_at: timestamp().default('CURRENT_TIMESTAMP'),
   updated_at: timestamp().default('CURRENT_TIMESTAMP', true),
})

ProductSchema.add("categories", relation("product_id", "categories"))

class Category extends Model {
   table = "categories"
   schema: Schema = categoriesSchema
}

export default Category