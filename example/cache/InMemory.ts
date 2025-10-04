
class InMemoryCache {
   limit: number;
   map: Map<string, string>;
   constructor(limit = 1000) {
      this.limit = limit;
      this.map = new Map(); // preserves insertion order
   }

   get(key: string) {
      if (!this.map.has(key)) return null;
      // refresh usage order
      const value = this.map.get(key) as string
      this.map.delete(key);
      this.map.set(key, value);
      return value;
   }

   set(key: string, value: string) {
      if (this.map.has(key)) {
         this.map.delete(key);
      } else if (this.map.size >= this.limit) {
         // delete oldest (least recently used)
         const oldestKey = this.map.keys().next().value;
         this.map.delete(oldestKey);
      }
      this.map.set(key, value);
   }
}


export default InMemoryCache;