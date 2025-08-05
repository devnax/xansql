

const ProductSchema = new Schema("products", {
   id: number().int(),
   name: string(),
   price: number().positive(),
   currency: string().length(3),
   createdAt: date(),
   updatedAt: date(),
   user: UserSchema.field("products"),
})

const UserMetaSchema = new Schema("metas", {
   likes: number(),
   notes: string().optional(),
   user: UserSchema.field("metas"),
})

const UserSchema = new Schema("users", t => ({
   id: t.number().int(),
   name: t.string(),
   email: t.string().email(),
   status: t.enum(["active", "inactive", "pending"]).default("active"),
   tags: t.array(t.string()).optional(),
   isAdmin: t.boolean().optional(),
   createdAt: t.date(),
   creator: UserSchema.optional(),
   creators: t.array(UserSchema).optional(),
}))


UserSchema.idField()
UserSchema.get()
UserSchema.getColumnNames()
UserSchema.getOptionalColumns()
UserSchema.getRequiredColumns()
UserSchema.getRelations()
UserSchema.validate()
UserSchema.validateColumn()

const row = {
   id: 1,
   name: "John Doe",
   email: "",
   date: new Date(),
}

row.date.format("YYYY-MM-DD")