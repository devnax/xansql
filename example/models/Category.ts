import { id, relation, string, timestamp } from "../../src";
import Model from "../../src/model";
import Schema, { integer } from "../../src/schema";
import { ProductSchema } from "./Product";


export const CategorySchema = new Schema({
   id: id(),
   name: string().notNull(),
   description: string().notNull(),
   price: string().notNull(),
   product_id: integer().references('products', 'id').onDelete('CASCADE').onUpdate('CASCADE'),
   product: relation("product_id"),
   created_at: timestamp().default('CURRENT_TIMESTAMP'),
   updated_at: timestamp().default('CURRENT_TIMESTAMP', true),
})

ProductSchema.add("categorys", relation("product_id", "categorys"))

class Category extends Model {
   table = "categorys"
   schema: Schema = CategorySchema
}

export default Category