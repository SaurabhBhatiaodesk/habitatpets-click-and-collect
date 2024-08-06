import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";

export async function loader({ request }) {
    const accessToken = '7a1891347cf4af'; 
    const response = await fetch(`https://ipinfo.io/json?token=${accessToken}`);
    const data = await response.json();
    return await cors(request, json({ "data": data}));  
}  