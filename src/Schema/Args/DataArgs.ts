import Schema from ".."
import { isObject } from "../../utils"
import Foreign from "../include/Foreign"
import { DataArgsType } from "../type"


type DataType = { [column: string]: any }

class DataArgs {
   model: Schema
   args: DataArgsType

   private _data: DataType = {}
   private _relations = {}

   constructor(model: Schema, args: DataArgsType) {
      this.model = model
      this.args = args

      if (Array.isArray(args)) {
         for (let data of args) {

         }
      } else {
         for (let column in args) {
            const field = model.schema[column]
            let value: any = args[column]
            if (Foreign.is(field) && isObject(value)) {
               this._relations[column] = value
            } else {
               this._data[column] = value
            }
         }

         // if no columns are selected, select all columns
         if (Object.keys(this._data).length === 0) {
            for (let column in model.schema) {
               let field = model.schema[column]
               if (!Foreign.is(field)) {
                  this._data[column] = null
               }
            }
         }

         // always include ID column
         if ((this.model.IDColumn in this._data)) {
            throw new Error("Cannot set value for ID column in create data.");
         }
      }
   }

   get sql() {
      const model = this.model
      const schema = model.schema
      const columns: string[] = []
      const values: any[] = []


   }

   get data() {
      return this._data
   }

}

export default DataArgs