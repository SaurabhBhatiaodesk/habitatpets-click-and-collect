import { json } from "@remix-run/node";
import db from "../../db.server";
import { cors } from "remix-utils/cors";

export async function action({ request }) {
    const body = await request.json(); 
    const { shop, productId } = body;
  

  const token = await db.session.findFirst({
    where: { shop },
  });

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Shopify-Access-Token", token.accessToken);
  
  const graphql = JSON.stringify({
    query: `query MyQuery {\r\n  product(id: \"gid://shopify/Product/${productId}\") {\r\n        tags\r\n    title\r\n    tracksInventory\r\n    collections(first: 10) {\r\n      nodes {\r\n        id\r\n        title\r\n        handle\r\n      }\r\n    }\r\n    variants(first: 10) {\r\n      nodes {\r\n        inventoryItem {\r\n          inventoryLevels(first: 10) {\r\n            edges {\r\n              node {\r\n                location {\r\n                  activatable\r\n                  name\r\n                }\r\n                id\r\n                quantities(names: \"available\") {\r\n                  name\r\n                  id\r\n                  quantity\r\n                }\r\n              }\r\n            }\r\n          }\r\n        }\r\n      }\r\n    }\r\n  }\r\n}\r\n`,
    variables: {}
  })
  console.log('query', graphql);
  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: graphql,
    redirect: "follow"
  };
  
  let response= await fetch(`https://${shop}/admin/api/2024-04/graphql.json`, requestOptions)
   
    let data=await response.json();

    return await cors(request, json({ "data": data}));
  
    
 // } catch (error) {console.error("Error fetching inventory locations:", error);return await cors(request, json({ "error":"500" }));}
  // console.log(token);
  

  
}  