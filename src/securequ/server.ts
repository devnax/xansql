import { SecurequServer } from "securequ";
import xansql from "..";
import { ListenerInfo } from "securequ/server/types";

const sqserver = new SecurequServer({
   basepath: "/data"
});

sqserver.get('/test', () => {
   throw {
      name: "1",
      age: 20
   }
})

sqserver.post('/:id', (info) => {
   throw new Response(JSON.stringify({ name: "1" }))
})

export default sqserver

const XansqlSecurequServer = async (xansql: xansql, info: ListenerInfo, req: any) => {
   const response = await sqserver.listen(info, req)
}