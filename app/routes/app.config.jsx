import React, { useState, useCallback } from 'react';
import {
  Tooltip, 
  Icon,
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  Button,
  ButtonGroup,
  Checkbox,
  TextField,
  Select,
  RadioButton,
  FormLayout
} from "@shopify/polaris";
import { useLoaderData } from '@remix-run/react';
import { json } from "@remix-run/node";



// Handles form submission
export const action = async ({ request }) => {
  const formData = await request.formData();
  console.log(formData);

  for (const [key, value] of formData.entries()) {
    console.log(`Key: ${key}, Value: ${value}`);
  }

  formData.forEach((value, key) => {
    console.log(`Key: ${key}, Value: ${value}`);
  });

  const name = formData.get("visitorsName");
  return json({ message: `Hello, ${name}` });
};

// Fetches data for the form
export const loader = async ({ request }) => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Bearer KRXB192284InWrLexCVXSQbiNOd90RfF3KT4irSmphw-sD40kxr1oVpZHMtvdrVvvUbA9jy7o3");

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const response = await fetch("https://main.dev.saasintegrator.online/api/v1/credential-form", requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    const form = await fetch("https://main.dev.saasintegrator.online/api/v1/product/config-form", requestOptions);
    if (!form.ok) {
      throw new Error(`HTTP error! status: ${form.status}`);
    }
    const form_data = await form.json();

    return { form: form_data, data: data };
  } catch (error) {
    console.error("Error fetching product preference:", error);
    throw error;
  }
};


export default function configPage() {
  const [isFirstButtonActive, setIsFirstButtonActive] = useState(true);
  const [inputValues, setInputValues] = useState({});
  const [radioValues, setRadioValues] = useState({});
  const data = useLoaderData();

  const handleChangeRadio = useCallback((platformName, newValue) => {
    setRadioValues(prevState => ({
      ...prevState,
      [platformName]: newValue
    }));
  }, []);

  const handleChange = useCallback((value, name) => {
    setInputValues(prevState => ({
      ...prevState,
      [name]: value
    }));
  }, []);

  const handleSelectChange = useCallback((name, value) => {
    setInputValues(prevState => ({
      ...prevState,
      [name]: value
    }));
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = {
      ...inputValues,
      ...radioValues
    };
    console.log(formData);
  };

  const product = data.data;
  const form = data.form;

  const handleFirstButtonClick = useCallback(() => {
    if (isFirstButtonActive) return;
    setIsFirstButtonActive(true);
  }, [isFirstButtonActive]);

  const handleSecondButtonClick = useCallback(() => {
    if (!isFirstButtonActive) return;
    setIsFirstButtonActive(false);
  }, [isFirstButtonActive]);

  return (
    <form onSubmit={handleSubmit}>
      <Page>
        <ui-title-bar title="Click & Collect">
          <button variant="primary" type="submit">
            Save
          </button>
        </ui-title-bar>

        <Layout>
          <Layout.Section>
            <Text as="h1" variant="headingMd">
              Configuration
            </Text>
          </Layout.Section>
          <Layout.Section>
            <ButtonGroup variant="segmented">
              <Button pressed={isFirstButtonActive} onClick={handleFirstButtonClick}>
                General
              </Button>
              <Button pressed={!isFirstButtonActive} onClick={handleSecondButtonClick}>
                Module Configuration
              </Button>
            </ButtonGroup>
          </Layout.Section>

          {product.plugin_form.map((plugin, index) => (
            <Layout.Section key={index}>
              <Card title={plugin.label}>
                <FormLayout>
                <div style={{display:'flex', flexWrap:'wrap', justifyContent:'space-between'}} > 
                  {Object.entries(plugin.fields).map(([fieldKey, field]) => (
                      <div style={{width:'48%'}}>
                      {(() => {
                        switch (field.type) {
                          case 'url':
                            return (
                              <TextField
                                label={field.label}
                                value={inputValues[field.name] || ''}
                                onChange={(value) => handleChange(value, field.name)}
                                name={field.name}
                                type="url"
                                required={field.required}
                                helpText={field.description}
                              />
                            );
                          case 'text':
                          case 'password':
                            return (
                              <TextField
                                label={field.label}
                                value={inputValues[field.name] || ''}
                                onChange={(value) => handleChange(value, field.name)}
                                name={field.name}
                                type={field.type}
                                required={field.required}
                                helpText={field.description}
                              />
                            );
                          default:
                            return null;
                        }
                      })()}
                      </div>
                  ))}
                  </div>

                </FormLayout>
              </Card>
            </Layout.Section>
          ))}
        </Layout>
      </Page>
    </form>
  );
}