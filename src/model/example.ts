
const find = {
   take: 10,
   skip: 0,
   orderBy: {
      id: 'asc'
   },
   where: {
      id: 1,
      user_metas: {
         where: {
            id: 1
         },
         select: {
            id: true,
            name: true
         }
      }
   },
   select: {
      id: true,
      name: true,
   }
}


const create = {
   data: {
      name: 'test',
      user_metas: {
         select: {
            key: true,
         },
         data: [
            {
               key: 'meta',
               value: 'test',
            }
         ]
      }
   },
   select: {
      id: true,
      name: true,
   }
}

const update = {
   data: {
      name: 'test',
      user_metas: {
         where: {
            key: "meta"
         },
         data: [
            {
               key: 'meta',
               value: 'test',
            }
         ]
      }
   },
   where: {
      name: {
         contains: 'test'
      },
      user_metas: {
         where: {
            key: 'meta',
         },
         select: {
            id: true,
            name: true
         }
      }
   },
   select: {
      id: true,
      name: true
   }
}

const del = {
   where: {
      name: {
         contains: 'test'
      },
      user_metas: {
         where: {
            key: "asd"
         }
      }
   }
}

