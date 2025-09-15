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
   return Array.from({ length: count }, () => ({
      name: faker.commerce.department(),
      description: faker.commerce.productDescription(),
   }));
}

function buildProducts(count = 10): Product[] {
   return Array.from({ length: count }, () => {
      return {
         name: faker.commerce.productName(),
         description: faker.commerce.productDescription(),
         price: faker.commerce.price(),
         categories: buildCategories(),
      };
   });
}

function buildUserMetas(count = 5): UserMeta[] {
   return Array.from({ length: count }, () => ({
      meta_key: faker.helpers.arrayElement(['bio', 'location', 'website']),
      meta_value: faker.lorem.words(3),
   }));
}

function buildUsers(count = 3): User[] {
   return Array.from({ length: count }, () => {
      return {
         name: faker.person.fullName(),
         username: faker.internet.username(),
         email: faker.internet.email(),
         password: faker.internet.password(),
         metas: buildUserMetas(),
         products: buildProducts(),
      };
   });
}

export default buildUsers
