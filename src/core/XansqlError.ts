type XanErrorOption = {
   model?: string;
   column?: string;
   message: string;
}


class XansqlError extends Error {
   model?: string
   column?: string

   constructor(opt: XanErrorOption | string) {
      let model = typeof opt === 'string' ? undefined : opt.model;
      let column = typeof opt === 'string' ? undefined : opt.column;
      let message = typeof opt === 'string' ? (opt as string) : opt.message;
      super(message);
      this.name = "XansqlError";
      this.model = model;
      this.column = column;
   }
}

export default XansqlError;