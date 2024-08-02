import { json } from "@remix-run/node";
import db from "../../db.server";
import { cors } from "remix-utils/cors";

export async function action({ request }) {
    const body = await request.json(); 
    const { shop, productId } = body;
  

  const token = await db.session.findFirst({
    where: { shop },
  });

  let query=`query { product(id: "gid://shopify/Product/${productId}") { tags title tracksInventory collections(first: 10) { nodes { id title handle } } variants(first: 10) { nodes { inventoryItem { inventoryLevels(first: 10) { edges { node { location { activatable name } id quantities(names: "available") { name id quantity } } } } } id } } } }`;
  console.log("query: " ,query)
  console.log("token.accessToken: " ,token.accessToken,`https://${shop}/admin/api/2024-04/graphql.json`);
  
    let response = await fetch(`https://${shop}/admin/api/2024-04/graphql.json`, {     
      method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token.accessToken },
      body: JSON.stringify({ query: query, variables: {} })
    });
    console.log(response);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    let data = await response.json();
    return await cors(request, json({ data }));
  
  // console.log(token);
  

  
}  