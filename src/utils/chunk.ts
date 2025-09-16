
/**
 * Utility functions to chunk arrays or numbers into smaller parts
 * @param length number of items
 * @param perPage number of items per page
 * @returns number of items per page
 */
const dynamicPerPage = (length: number, perPage?: number) => {
   if (perPage) return perPage;
   if (length <= 500) return 100;
   if (length <= 1000) return 200;
   if (length <= 2000) return 300;
   if (length <= 3000) return 400;
   if (length <= 5000) return 500;
   if (length <= 7000) return 700;
   if (length <= 10000) return 1000;

   // For very large datasets
   return Math.min(Math.ceil(length / 10), 5000);
}

/**
 * Generator: chunk an array into sub-arrays
 * Example: chunkArray([1,2,3,4,5], 2) → [[1,2],[3,4],[5]]
 */
export function* chunkArray<T = any>(array: T[], perPage?: number) {
   const length = array.length;
   perPage = dynamicPerPage(length, perPage);
   let chunkIndex = 0;
   for (let i = 0; i < length; i += perPage) {
      yield {
         index: chunkIndex,
         chunk: array.slice(i, i + perPage),
      };
      chunkIndex++;
   }
}


/**
 * Generate batching steps as { take, skip }
 * @param total Total items to process
 * @param batchSize Size of each batch
 * @param skipStart Optional starting skip value (default 0)
 */
export function* chunkNumbers(total: number, perPage?: number) {
   perPage = dynamicPerPage(total, perPage);
   for (let i = 0; i < total; i += perPage) {
      const take = Math.min(perPage, total - i);
      const skip = i;
      yield { take, skip };
   }
}
