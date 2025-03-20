import Constraints from './Constraints';
import { XansqlDataTypes } from './types';

class Column extends Constraints {
   type: XansqlDataTypes = 'string';
   column: string = '';
   values: (string | number)[] = [];

   constructor(type: XansqlDataTypes, values: (string | number)[] = []) {
      super();
      this.type = type;
      this.values = values;
   }

   get() {
      return {
         type: this.type,
         values: this.values,
         constraints: this.constraints
      }
   }
}

export default Column