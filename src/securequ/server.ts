import securequ from "securequ";

const sqserver = new securequ.SecurequServer({
   basepath: "/data"
});

sqserver.get('/testasdasd', () => {
   throw {
      name: "1",
      age: 20
   }
})

sqserver.post('/:id', (info) => {
   throw new Response(JSON.stringify({ name: "1" }))
})

export default sqserver