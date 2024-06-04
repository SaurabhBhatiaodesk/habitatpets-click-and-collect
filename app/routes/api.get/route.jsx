import { json } from "@remix-run/node";
import db from "../../db.server";
import { cors } from "remix-utils/cors";

export async function loader({ request }) {
  // const { shop } = await authenticate.webhook(
  //   request
  // );
  // console.log(shop,"shop");
  const { searchParams } = new URL(request.url);
  let shop = searchParams.get("shop");
  // console.log(shop, "shop");

  const token = await db.session.findFirst({
    where: { shop },
  });
  // console.log(token);

  const accessToken = token.accessToken;
  

  return await cors(request, json({ accessToken: accessToken }));
}  