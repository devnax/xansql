

const where = {
   name: "John Doe",
   email: `john${Math.floor(Math.random() * 10000)}@doe.com`,
   created_at: new Date(),
   option: {
      theme: "dark",
      notifications: false,
   },

   // or as array for hasOne relation
   option: [
      {
         theme: "dark",
         notifications: false,
      }
   ],

   user_posts: [
      {
         title: "Hello World",
         content: "This is my first post",
      },
      {
         title: "Another Post",
         content: "This is another post",
      },
   ]
}


const insert = {
   name: "John Doe",
   email: `john${Math.floor(Math.random() * 10000)}@doe.com`,
   created_at: new Date(),

   // must be an object for hasOne relation
   option: {
      theme: "dark",
      notifications: false,
   },

   // must be an array for hasMany relation
   user_posts: [
      {
         title: "Hello World",
         content: "This is my first post",
      },
      {
         title: "Another Post",
         content: "This is another post",
      },
   ]
}

const select = {
   name: true,
   email: true,
   created_at: true,

   // must be an object for hasOne relation
   option: {
      theme: true,
      notifications: true,
   },

   user_posts: {
      select: {
         title: true,
         content: true,
      }
   }
}