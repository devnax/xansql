
const db = new xansql('example.db');
// or
const db1 = new xansql({
   host: 'localhost',
   user: 'root',
   password: 'password',
   database: 'test'
});
// or
const db2 = new xansql(() => {
   let database = 'test';
   if (typeof window === 'undefined') {
      const auth = global.auth;
      if (!auth) {
         throw new Error("Auth not found");
      }
      database = `db_${auth.id}`
   }
   return {
      host: 'localhost',
      user: 'root',
      password: 'password',
      database
   }
});

db.registerDialect(MysqlDialect);
db.registerModel(Model);

class xansql {
   dialects = {}
   models = {}
   dialect = null
   config = null

   constructor(config) {
      this.config = config;
      this.dialects = {};
      this.models = {};
      this.dialect = 'mysql'; // demo
   }

   registerDialect(dialect) {
      const d = new dialect(this.config);
      this.dialects[dialect.constructor.name] = d
   }

   registerModel(model) {
      const m = new model(this);
      if (!m.table) {
         throw new Error("Model must have a table name");
      }
      if (!m.schema) {
         throw new Error("Model must have a schema");
      }
      const dialect = this.getDialect();
      const schema = dialect.buildSchema(m.schema());
      this.models[m.table] = {
         model: m,
         schema: schema
      }
   }

   getDialect() {
      const dialect = this.dialects[this.dialect];
      if (!dialect) {
         throw new Error(`Dialect ${this.dialect} not registered`);
      }
      return dialect;
   }

   getModel(model) {
      return this.models[model];
   }

   excute(sql, params) {
      const dialect = this.getDialect();
      return dialect.excute(sql, params, this.getDBName());
   }

   migrate() {

   }
}

class Model {
   table = ""
   xansql = null
   schema(schema) { }
   find(args) { }
   create(args) { }
   delete(args) { }
   update(args) { }
   sync() { }
   drop() { }

}

class User extends Model {
   table = "user"
   database = 'test'
   schema() {
      return {
         id: "int",
         name: "string",
         age: "int",
         email: "string"
      }
   }

   beforeExcute() {

   }

   afterExcute() {
      // do something after excute
   }
}

class MysqlDialect {
   dialect = "mysql"
   config = null
   constructor(config) {
      this.config = config;
   }
   buildSchema(schema) { }
   excute(sql, params) {
      let conf = this.config
      if (typeof conf === 'function') {
         conf = conf();
      } else if (typeof conf === 'string') {
         conf = {
            database: conf
         }
      }
   }
}


class CacheDialect {
   dialect = "sqlite"
   config = null
   constructor(config) {
   }
   async getDb() {
      if (this.db) {
         return this.db;
      }
      let db
      if (typeof window !== 'undefined') {
         // browser 
         const mod = await import('sql.js');
         const sqlite = await mod.Database;
         db = sqlite;
      } else {
         const mod = await import('sqlite');
         const sqlite = await mod.open({
            filename: 'mydb.db',
            driver: db.Database
         });
         db = sqlite;
      }
      this.db = db;
      return db;
   }
   buildSchema(schema) { }
   async excute(sql, params) {
      const db = await this.getDb();
   }
}

