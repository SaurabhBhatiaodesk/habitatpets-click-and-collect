import { json } from "@remix-run/node";
import db from "../../db.server";
import { cors } from "remix-utils/cors";

export async function action({ request }) {
    const body = await request.json(); 
    const { shop, productId } = body;
  

  const token = await db.session.findFirst({
    where: { shop },
  });

  const accessToken = '7a1891347cf4af'; 
  
    const response = await fetch(`https://ipinfo.io/json?token=${accessToken}`);
  const data = await response.json();
  


    return await cors(request, json({ "data": data}));
  

  

  
}  