export class XansqlResultArray<T> extends Array<T> {
   errors: Map<string, string> = new Map();

   hasError(): boolean {
      return this.errors.size > 0;
   }

   setError(key: string, error: string) {
      this.errors.set(key, error);
   }

   getErrors() {
      return this.errors
   }

   first(): T | null {
      return this.length > 0 ? this[0] : null;
   }

   last(): T | null {
      return this.length > 0 ? this[this.length - 1] : null;
   }

   count(): number {
      return this.length;
   }

   isEmpty(): boolean {
      return this.length === 0;
   }
}


export const XansqlResult = <T>(arr: T[]): (XansqlResultArray<T>) => {
   Object.setPrototypeOf(arr, XansqlResultArray.prototype);
   (arr as any).errors = new Map<string, string>();
   return arr as XansqlResultArray<T>;
};