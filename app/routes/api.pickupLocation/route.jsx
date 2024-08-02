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
    query: "query MyQuery {\r\n  locations(first: 10) {\r\n    nodes {\r\n      activatable\r\n      hasActiveInventory\r\n      isActive\r\n      localPickupSettingsV2 {\r\n        instructions\r\n        pickupTime\r\n      }\r\n      name\r\n      id\r\n    }\r\n  }\r\n}\r\n",
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