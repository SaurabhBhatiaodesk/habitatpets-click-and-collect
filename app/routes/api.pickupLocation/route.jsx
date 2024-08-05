import { json } from "@remix-run/node";
import db from "../../db.server";
import { cors } from "remix-utils/cors";

export async function loader({ request }) {
  const { searchParams } = new URL(request.url);
  let shop = searchParams.get("shop");

  const auth_session = await db.session.findFirst({
    where: { shop },
  });

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Shopify-Access-Token", auth_session?.accessToken);




  const graphql = JSON.stringify({
    query: "query MyQuery {\r\n  locations(first: 10) {\r\n    nodes {\r\n      activatable\r\n      hasActiveInventory\r\n      isActive\r\n      localPickupSettingsV2 {\r\n        instructions\r\n        pickupTime\r\n      }\r\n      name\r\n      id\r\n    }\r\n  }\r\n}\r\n",
    variables: {}
  })
  console.log('query', graphql);
  const requestOptionslocations = {
    method: "POST",
    headers: myHeaders,
    body: graphql,
    redirect: "follow"
  };
  
  let locationsResult= await fetch(`https://${shop}/admin/api/2024-04/graphql.json`, requestOptionslocations)
  let data=await locationsResult.json();
 
  return await cors(request, json(data));
}