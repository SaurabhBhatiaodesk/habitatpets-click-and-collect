import "@shopify/shopify-app-remix/adapters/node";
import {
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
  LATEST_API_VERSION,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-04";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: LATEST_API_VERSION,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  restResources,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {

      shopify.registerWebhooks({ session });

      await getAuthToken(session);

    },

  },
  future: {
    v3_webhookAdminContext: true,
    v3_authenticatePublic: true,
    unstable_newEmbeddedAuthStrategy: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});
export default shopify;
export const apiVersion = LATEST_API_VERSION;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
export const APPURL=process.env.SHOPIFY_APP_URL;

async function getAuthToken(session) {
  console.log("getAuthToken ------------------->")
  try {
    console.log(session,'session');
    var myHeaders2 = new Headers();
    myHeaders2.append("X-Shopify-Access-Token", session.accessToken);

    const requestOptions2 = {
      method: "GET",
      headers: myHeaders2,
      redirect: "follow"
    };

  await fetch('https://'+ session.shop + "/admin/api/2024-04/shop.json", requestOptions2)
    .then((response) => response.json())
    .then(async(result) => {
      console.log(result, 'result');
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      
        

      const requestOpt = {
        method: "GET",
        redirect: "follow"
      };
      
      let plugin=await fetch("https://main.dev.saasintegrator.online/api/v1/platforms", requestOpt);
      console.log(plugin,":::plugin");
      let plugin_data=await plugin.json();
      console.log(plugin_data,":::plugin_data");
      let filter_data = plugin_data.platforms.filter((pd) => pd.name === "o360-retail-express" || pd.name === "o360-shopify"); 
      console.log(filter_data,":::filter_data");
       const plugin_ids=[];
       filter_data.map((fd)=>{
        plugin_ids.push(fd.id);
       });
       const raw =  JSON.stringify({
        ...session,
        "state": session?.state.trim() !== "" ? session?.state : null,
        'email' : result.shop?.email,
        "plugin_ids":plugin_ids
      });
         console.log('testing ', raw);
        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };
        const email = result.shop?.email;
      await fetch("https://main.dev.saasintegrator.online/api/v1/user-connection", requestOptions)
        .then((response) => response.json())
        .then((result) => {
     
          console.log('testing result', result);

            const data = {
              shop:session.shop,
              ...result.data.connection,
              token: result.data.token,
              email: email
          };
          console.log('testings ', data);
        
        createOrUpdateUserConnection(data)
            .then(result => {
                console.log("User connection created or updated:", result);
            });
        });

    });
  }
  catch(error){
    console.log('error',error);
  }

}


async function createOrUpdateUserConnection(data) {
// console.log('createOrUpdateUserConnection ',data)
const existingUserConnection = await prisma.userConnection.findFirst({
  where: {
      shop: data.shop,
  },
});

if (existingUserConnection) {
  const updatedUserConnection = await prisma.userConnection.update({
      where: {
          shop: data.shop,
      },
      data: {
          // connection_id: data.id,
          // uid: data.uid,
          // user_id: data.user_id,
          // plan_id: data.plan_id,
          // custom_name: data.custom_name,
          // custom_note: data.custom_note,
          // sync_type: data.sync_type,
          // configured: data.configured,
          // is_sync_enabled: data.is_sync_enabled,
          // is_plugins_connected: data.is_plugins_connected,
          // config: data.config,
          // created_at: data.created_at,
          // updated_at: data.updated_at,
          // status: data.status,
          // active_subscription_id: data.active_subscription_id,
          token: data.tokens
      },
  });
  return updatedUserConnection;
} else {
    const newUserConnection = await prisma.userConnection.create({
        data: {
            connection_id: data.id,
            shop: data.shop,
            uid: data.uid,
            user_id: data.user_id,
            plan_id: data.plan_id,
            custom_name: data.custom_name,
            custom_note: data.custom_note,
            sync_type: data.sync_type,
            configured: data.configured,
            is_sync_enabled: data.is_sync_enabled,
            is_plugins_connected: data.is_plugins_connected,
            config: data.config,
            created_at: data.created_at,
            updated_at: data.updated_at,
            status: data.status,
            active_subscription_id: data.active_subscription_id,
            token: data.token,
            email: data.email,
        },
    });
    return newUserConnection;
}
}
