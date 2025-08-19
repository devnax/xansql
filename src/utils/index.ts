const freezeObject = (obj: any) => {
   Object.getOwnPropertyNames(obj).forEach((prop) => {
      const value = obj[prop];
      if (value && typeof value === "object") {
         freezeObject(value); // recursively freeze
      }
   });
   return Object.freeze(obj);
}


export {
   freezeObject,
}