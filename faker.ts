import { faker } from '@faker-js/faker';

type Category = {
   name: string;
   description: string;
};

type Product = {
   name: string;
   description: string;
   price: string;
   categories: Category[];
};

type UserMeta = {
   meta_key: string;
   meta_value: string;
};

type User = {
   name: string;
   username: string;
   email: string;
   password: string;
   metas: UserMeta[];
   products: Product[];
};

function buildCategories(count = 5): Category[] {
   let items: any = []
   for (let i = 0; i < count; i++) {
      items.push({
         name: faker.commerce.department(),
         description: faker.commerce.productDescription(),
      })
   }
   return items
}

function buildProducts(count = 10): Product[] {
   let items: any = []
   for (let i = 0; i < count; i++) {
      let item = {
         name: faker.commerce.productName(),
         description: faker.commerce.productDescription(),
         price: faker.commerce.price({
            min: 10,
            max: 1000,
            dec: 2,
         }),
         categories: buildCategories(),
      }

      items.push(item)
   }

   return items
}

function buildUserMetas(count = 5): UserMeta[] {
   let items: any = []
   for (let i = 0; i < count; i++) {
      items.push({
         meta_key: faker.helpers.arrayElement(['bio', 'location', 'website', 'twitter', 'github', 'linkedin', 'age']),
         meta_value: faker.lorem.words(3),
      })
   }
   return items
}

async function fileFromUrl(url: string, fileName: string): Promise<File> {
   const response = await fetch(url);

   // Ensure it's a valid response
   if (!response.ok) return new File(["lorem"], fileName);

   // Convert response to Blob
   const blob = await response.blob();

   // Create a File from Blob
   const file = new File([blob], fileName, { type: blob.type });

   return file;
}


async function buildUsers(count = 3): Promise<User[]> {
   let items: any = []
   for (let i = 0; i < count; i++) {
      items.push({
         name: faker.person.fullName(),
         username: faker.internet.username(),
         email: faker.internet.email(),
         password: faker.internet.password(),
         metas: buildUserMetas(),
         products: buildProducts(),
         // photo: new File(["lorem"], "avatar.png", { type: "image/png" }),
      })
   }
   return items
}

export default buildUsers
