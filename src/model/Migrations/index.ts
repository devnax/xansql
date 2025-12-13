import Model from "..";

class Migrations {
   model: Model;
   TableMigration: any;
   constructor(model: Model) {
      this.model = model;
   }

   generate() {
      for (let column in this.model.schema) {
         const field = this.model.schema[column];
      }
   }
}

export default Migrations;