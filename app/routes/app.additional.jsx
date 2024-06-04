import {
  Box,
  Card,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  Form,
  FormLayout,
  TextField,
  Button,
  LegacyCard,
  Layout,
} from "@shopify/polaris";
import { useEffect, useState, useCallback } from "react";
import { useSubmit, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function loader({ request }) {
  const admin = await authenticate.admin(request);
  const shop = admin.session.shop;
  const searchClass = await db.googleApi.findFirst({
    where: { shop },
  });
  return json({ searchClass });
}



export async function action({ request }) {
  const admin = await authenticate.admin(request);
  const shop = admin.session.shop;
  const body = await request.formData();
  const apikey = body.get("apikey");

  console.log("apikeyapikeyapikey",apikey);

  const existingSearchClass = await db.googleApi.findFirst({
    where: { shop },
  });

  if (!existingSearchClass) {
    await db.googleApi.create({
      data: {
        shop,
        apikey: apikey
      },
    });
  } else {
    await db.googleApi.updateMany({
      where: { shop },
      data: {
        apikey: apikey,
        // html :html,
      },
    });
  }
  return "success";
}



export default function AdditionalPage() {
  const submit = useSubmit();
  const invoices = useLoaderData();

  console.log("invoicesinvoices",invoices);
  const prevData = invoices?.searchClass?.apikey;

  console.log("prevDataprevDataprevData",prevData);
  // const htmlprevData = invoices?.html;
  
  const [data, setdata] = useState(prevData || "");
  // const [htmldata, sethtmldata] = useState(htmlprevData || "");
  
  const handleSubmit = useCallback(() => {
    submit({ apikey: data, }, { method: "post" });
  }, [data, submit]);

  const handleDataChange = useCallback((value) => setdata(value), []);

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <LegacyCard title="Enter Google Api Key" sectioned>
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <TextField
                  value={data}
                  onChange={handleDataChange}
                  // label="Enter input data"
                  type="text"
                  autoComplete="off"
                  name="apikey"
                />
                 {/* <TextField
                  value={htmldata}
                  onChange={handleHtmlDataChange}
                  // label="Enter input data"
                  type="text"
                  autoComplete="off"
                  name="html"
                />  */}
                <Button textAlign="center" submit>
                  Save
                </Button>
              </FormLayout>
            </Form>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

