import Model from ".";
import Xansql from "../core/Xansql";

export class AliasGenerate {
   private static SQL_KEYWORDS = new Set([
      "as", "in", "is", "on", "or", "to", "by", "and", "not", "all", "any", "asc", "desc",
      "select", "from", "where", "join", "left", "right", "inner", "outer", "full",
      "group", "order", "having", "limit", "offset", "union", "case", "when", "then",
      "else", "end", "exists", "between", "like", "into", "create", "table", "insert",
      "update", "delete", "drop", "alter", "index", "view", "primary", "foreign", "key", "use"
   ]);

   private used = new Set<string>();

   constructor(
      private xansql: Xansql,
      private model: Model<any>
   ) {
      for (const m of xansql.models.values()) {
         if (m.alias) this.used.add(m.alias);
      }
   }

   private base36Hash(str: string): string {
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) {
         h ^= str.charCodeAt(i);
         h = Math.imul(h, 16777619);
      }
      return (h >>> 0).toString(36);
   }

   private splitWords(name: string): string[] {
      return name.split(/_|(?=[A-Z])/).filter(Boolean);
   }

   private isInvalid(alias: string): boolean {
      return this.used.has(alias) || AliasGenerate.SQL_KEYWORDS.has(alias);
   }

   private makeBase(words: string[], table: string): string {
      let base =
         words.length === 1
            ? words[0].slice(0, 2)
            : words.map(w => w[0]).join('');

      base = base.toLowerCase();

      if (base.length < 2) {
         base = (base + table.slice(1, 2)).toLowerCase();
      }

      return base;
   }

   generate(): string {
      const table = this.model.table;
      const words = this.splitWords(table);

      // 1️⃣ readable base
      const base = this.makeBase(words, table);

      // 2️⃣ clean base
      if (!this.isInvalid(base)) {
         this.used.add(base);
         return base;
      }

      // 3️⃣ expanded readable
      const expanded = words.map(w => w.slice(0, 2)).join('').toLowerCase();
      if (!this.isInvalid(expanded)) {
         this.used.add(expanded);
         return expanded;
      }

      // 4️⃣ deterministic hash suffix
      const hash = this.base36Hash(table).slice(0, 2);
      const hashed = (base + hash).slice(0, 4);
      if (!this.isInvalid(hashed)) {
         this.used.add(hashed);
         return hashed;
      }

      // 5️⃣ guaranteed unique fallback
      let i = 1;
      while (this.isInvalid(base + i)) i++;
      const finalAlias = base + i;
      this.used.add(finalAlias);
      return finalAlias;
   }
}