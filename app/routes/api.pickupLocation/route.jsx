// import { json } from "@remix-run/node";
// import db from "../../db.server";
// import { cors } from "remix-utils/cors";

// export async function loader({ request }) {
//   const { searchParams } = new URL(request.url);
//   let shop = searchParams.get("shop");

//   const auth_session = await db.session.findFirst({
//     where: { shop },
//   });

//   console.log("shop",shop)

//   console.log("auth_session?.accessToken",auth_session?.accessToken)

//   const myHeaders = new Headers();
//   myHeaders.append("Content-Type", "application/json");
//   myHeaders.append("X-Shopify-Access-Token", auth_session?.accessToken);




//   const graphql = JSON.stringify({
//     query: "query MyQuery {locations(first: 10) {nodes {activatable hasActiveInventory isActive localPickupSettingsV2 { instructions pickupTime } name id address {zip provinceCode province phone longitude latitude formatted countryCode country city address2 address1 } } } }",
//     variables: {}
//   })
//   console.log('query', graphql);
//   const requestOptionslocations = {
//     method: "POST",
//     headers: myHeaders,
//     body: graphql,
//     redirect: "follow"
//   };

//   let locationsResult= await fetch(`https://${shop}/admin/api/2024-04/graphql.json`, requestOptionslocations)
//   let data=await locationsResult.json();
//    console.log("data",data)
//   return await cors(request, json(data));
// }



import { json } from "@remix-run/node";
import db from "../../db.server";
import { cors } from "remix-utils/cors";

export async function loader({ request }) {
  // Extract shop parameter from the URL
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");

  // Validate shop parameter
  if (!shop) {
    return await cors(request, json(
      { error: "Shop parameter is required" },
      { status: 400 } // Bad Request
    ));
  }

  // Validate shop format (basic check for Shopify domain)
  if (!shop.endsWith(".myshopify.com")) {
    return await cors(request, json(
      { error: "Invalid shop domain" },
      { status: 400 } // Bad Request
    ));
  }

  // Find session in the database
  const auth_session = await db.session.findFirst({
    where: { shop },
  });

  // Validate session and access token
  if (!auth_session || !auth_session.accessToken) {
    return await cors(request, json(
      { error: "Invalid API key or access token" },
      { status: 401 } // Unauthorized
    ));
  }

  // Prepare headers for Shopify GraphQL API
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Shopify-Access-Token", auth_session.accessToken);

  // GraphQL query for locations
  const graphql = JSON.stringify({
    query: `
      query MyQuery {
        locations(first: 10) {
          nodes {
            activatable
            hasActiveInventory
            isActive
            localPickupSettingsV2 {
              instructions
              pickupTime
            }
            name
            id
            address {
              zip
              provinceCode
              province
              phone
              longitude
              latitude
              formatted
              countryCode
              country
              city
              address2
              address1
            }
          }
        }
      }
    `,
    variables: {},
  });

  console.log("query", graphql);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: graphql,
    redirect: "follow",
  };

  try {
    // Make the API call to Shopify
    const response = await fetch(`https://${shop}/admin/api/2024-04/graphql.json`, requestOptions);
    const data = await response.json();

    // Check for GraphQL errors
    if (data.errors) {
      console.error("GraphQL Errors:", data.errors);
      return await cors(request, json(
        { error: "Shopify API error", details: data.errors },
        { status: 400 } // Bad Request for API errors
      ));
    }

    // Return successful response
    return await cors(request, json(data));
  } catch (error) {
    console.error("Fetch Error:", error);
    return await cors(request, json(
      { error: "Failed to fetch data from Shopify API" },
      { status: 500 } // Internal Server Error
    ));
  }
}
