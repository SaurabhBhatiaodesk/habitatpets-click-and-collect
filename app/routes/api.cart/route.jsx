import { json } from "@remix-run/node";
import db from "../../db.server";
import { cors } from "remix-utils/cors";

export async function loader({ request }) {
  const { searchParams } = new URL(request.url);
  let shop = searchParams.get("shop");
  let product_id = searchParams.get("product_id");
  const auth_session = await db.session.findFirst({
    where: { shop },
  });
  let query = `query MyQuery { product(id: "gid://shopify/Product/${product_id}") { tags title tracksInventory collections(first: 10) { nodes { id title handle } } variants(first: 10) { nodes { inventoryItem { inventoryLevels(first: 10) { edges { node { location { activatable name } id quantities(names: "available") { name id quantity } } } } } id } } } }`;
  try {
      let response = await fetch(`https://${shop}/admin/api/2024-04/graphql.json`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": `${auth_session.accessToken}` },
          body: JSON.stringify({ query: query })
      });
      if (response.ok) {
          let data = await response.json();
          return await cors(request, json({ "data": data}));
      }
    }catch(e){
        return await cors(request, json({ "error": "500"}));
    }
      
}  