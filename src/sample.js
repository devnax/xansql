
const db = new xansql({
  dialect: 'mysql',
  host: 'localhost',
  user: '',
  password: '',
  database: 'test',
  ...others options
})


class User extends db.Model("users") {

  schema(table) {
    table.increments('id');
    table.string('name', 100);
    table.string('email', 100);
    table.string('password', 100);
    table.boolean('active');
    table.date('created_at');
    table.date('updated_at');
    table.string('metas').relation('user_metas', 'user_id');
  }
}

class UserMeta extends db.Model("user_metas") {
  schema(table) {
    table.increments('id');
    table.string('key', 100);
    table.string('value', 100);
    table.integer('user_id').relation('users', 'id');
  }
}

const users = await User.find({
  limit: 10,
  offset: 0,
  order: {
    created_at: 'desc'
  },
  where: {
    name: 'John Doe',
    metas: {
      key: 'age',
      value: 25
    }
  },
  select: {
    name: true,
    email: true,
    metas: {
      limit: 5,
      offset: 0,
      order: {
        key: 'asc'
      },
      select: {
        key: true,
        value: true
      }
    }
  }
});