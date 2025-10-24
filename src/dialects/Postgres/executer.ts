import { Pool, PoolClient, QueryResult } from 'pg';
import { XansqlConfigOptions } from '../../type';
import { isArray } from '../../utils';

class Executer {
   private config: XansqlConfigOptions;
   private pool: Pool | null = null;
   private client: PoolClient | null = null;
   private timer: NodeJS.Timeout | null = null;

   constructor(config: XansqlConfigOptions) {
      this.config = config;
   }

   async connect() {
      if (this.timer !== null) {
         clearTimeout(this.timer);
         this.timer = null;
      }
      if (this.client) return this.client;

      try {
         if (!this.pool) {
            const options = typeof this.config.connection === 'string'
               ? { connectionString: this.config.connection }
               : this.config.connection;
            this.pool = new Pool(options);
         }

         this.client = await this.pool.connect();

         // Auto-release client after 5 minutes of inactivity
         this.timer = setTimeout(() => {
            this.client?.release();
            this.client = null;
         }, 1000 * 60 * 5);

         return this.client;
      } catch (err) {
         console.error('PostgreSQL connection error:', err);
      }
   }

   async execute(query: string) {
      const client = await this.connect();
      if (!client) {
         throw new Error("PostgreSQL database connection failed");
      }

      let result: QueryResult;
      try {
         result = await client.query(query);
      } catch (err) {
         console.error('Query error:', err);
         throw err;
      }

      return {
         result: isArray(result.rows) ? result.rows : null,
         insertId: result.rows[0]?.id || 0, // assumes SERIAL PK returns as "id"
         affectedRows: result.rowCount,
      };
   }
}

export default Executer;
