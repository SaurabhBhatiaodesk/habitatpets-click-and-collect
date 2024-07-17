import { json } from "@remix-run/node";
import db from "../../db.server";
import { cors } from "remix-utils/cors";

export async function loader({ request }) {
  const { searchParams } = new URL(request.url);
  let shop = searchParams.get("shop");

  // console.log('shop ',shop, 'request.url ', request.url)
  let customerlocation = searchParams.get("customerlocation");
  let destinations = searchParams.get("destinations");


  const apiKey1 = await db.googleApi.findFirst({
    where: { shop },
  });
  
  console.log('apiKey1111111', apiKey1);    
      
  let apikey= 'AIzaSyBXNyT9zcGdvhAUCUEYTm6e_qPw26AOPgI';
  // let apikey= 'AIzaSyCko7Eg7TvcKwILrpqnwiRlWY9OlF31TpA';
  // let apikey = apiKey1.apikey;
  const requestOptions = {
    method: "GET",
    redirect: "follow"
  };
  const mapUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json?origins='+customerlocation+'&destinations='+destinations+'&key='+apikey;
  const response = await fetch(mapUrl, requestOptions);
  const data = await response.json();
  // console.log('data ',data);

  if (!response.ok) {
    console.log('error ',response)
  }else{
    console.log('response ',response);
  }

  //   var arr = {
  //     data: [],
  //     origin: []
  // };
  //   arr['data'].push(data.rows[0]);
  //   arr['origin'].push(data.origin_addresses);
  return await cors(request, json(data));
}