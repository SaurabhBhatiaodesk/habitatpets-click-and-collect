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
  console.log('apiKey1111111', apiKey1?.apikey);    
      
  let apikey = apiKey1?.apikey;
  //let apikey= 'AIzaSyBXNyT9zcGdvhAUCUEYTm6e_qPw26AOPgI';


  const graphql = JSON.stringify({
    query: "query MyQuery {locations(first: 10) {nodes {activatable hasActiveInventory isActive localPickupSettingsV2 { instructions pickupTime } name id address {zip provinceCode province phone longitude latitude formatted countryCode country city address2 address1 } } } }",
    variables: {}
  })
  console.log('query', graphql);
  const requestOptionslocations = {
    method: "POST",
    headers: myHeaders,
    body: graphql,
    redirect: "follow"
  };
  console.log(requestOptionslocations,"requestOptionslocationsrequestOptionslocations")
  let locationsResult= await fetch(`https://${shop}/admin/api/2024-04/graphql.json`, requestOptionslocations)
  let testres=await locationsResult.json();
  const destinationsArr = [];
  console.log(testres?.data?.locations?.nodes, '  testres : ',testres)
  if (testres?.data?.locations?.nodes?.length > 0) {
    const locations = testres?.data?.locations?.nodes;
     if (locations) {
      for (const location of locations) {
        if (location.address?.zip && location?.localPickupSettingsV2 != null) {
          destinationsArr.push(`${location.address?.address1} ${location.address?.city} ${location.address?.zip} ${location.address?.province} ${location.address?.country}`);
        }
      }
    }
  }   

  console.log('destinationsArr : ',destinationsArr)
    
  const requestOptions = {
    method: "GET",
    redirect: "follow"
  };
  const mapUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json?origins='+customerlocation+'&destinations='+destinationsArr.join("|")+'&key='+apikey;
  console.log('requestOptions mapurl--- : ',mapUrl);
  const response = await fetch(mapUrl, requestOptions);
  const data = await response.json();
  // console.log('data ',data);

  if (!response.ok) {
    console.log('error ',response)
  }else{
    console.log('response ',response);
  }
  const config = await fetch(
    "https://main.dev.saasintegrator.online/api/v1/click_and_collect/config-form",
    requestOptions,
  );
  if (!config.ok) {
    throw new Error(`HTTP error! status: ${config.status}`);
  }
  let kilo = await config.json();
  let quantity = 0;
  let kilometer = 50;
  kilo.config_form.map((item, index) => {
    if (item?.saved_values?.shopify_minimum_pickup_stock_quantity_check=='yes' && item?.saved_values?.shopify_minimum_pickup_stock_quantity_value!='') {
      quantity = item.saved_values?.shopify_minimum_pickup_stock_quantity_value;
    }
    if(item?.saved_values?.shopify_radius_kilometer_for_location_search!='')
    {
      kilometer=item.saved_values?.shopify_radius_kilometer_for_location_search;
    }
  });
  const newdata={...data,quantity,kilometer};
  //   var arr = {
  //     data: [],
  //     origin: []
  // };
  //   arr['data'].push(data.rows[0]);
  //   arr['origin'].push(data.origin_addresses);
  return await cors(request, json(newdata));
}
