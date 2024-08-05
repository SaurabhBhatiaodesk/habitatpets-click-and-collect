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
  const auth_session = await db.session.findFirst({
    where: { shop },
  });

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Shopify-Access-Token", auth_session?.accessToken);
  console.log('apiKey1111111', apiKey1.apikey);    
      
  //let apikey = apiKey1?.apikey;
  let apikey= 'AIzaSyBXNyT9zcGdvhAUCUEYTm6e_qPw26AOPgI';


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
  let testres=await locationsResult.json();
  const destinationsArr = [];

  if (testres.data.locations.nodes.length > 0) {
    const locations = testres?.data?.locations?.nodes;
     if (locations) {
      for (const location of locations) {
        if (location.address?.zip && location?.localPickupSettingsV2 != null) {
          destinationsArr.push(`${location.address?.address1} ${location.address?.city} ${location.address?.zip} ${location.address?.province} ${location.address?.country}`);
        }
      }
    }
  }   

  console.log('destinationsArr : ',destinationsArr, '  testres : ',testres)
    
  // let apikey= 'AIzaSyCko7Eg7TvcKwILrpqnwiRlWY9OlF31TpA';
  // let apikey = apiKey1.apikey;
  const requestOptions = {
    method: "GET",
    redirect: "follow"
  };
  const mapUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json?origins='+customerlocation+'&destinations='+destinationsArr.join("|")+'&key='+apikey;
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
