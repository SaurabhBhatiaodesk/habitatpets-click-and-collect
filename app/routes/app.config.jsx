import React, { useState, useCallback, useEffect } from 'react';
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
  FormLayout,
  ActionList,
  Thumbnail,
  Avatar,
  Form
} from "@shopify/polaris";
import { useLoaderData } from '@remix-run/react';
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { ChevronRightIcon } from '@shopify/polaris-icons';
import Cards from "../components/cards";

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
  const admin = await authenticate.admin(request);
  const shop = admin.session.shop;
  const auth = await db.session.findFirst({
    where: { shop },
  });

  const store = await db.userConnection.findFirst({
    where: { shop },
  });
  //  console.log("authauthauthauthauth",store);
  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Bearer " + store.token);

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
    let data = await response.json();

    data.plugin_form.map((item, index) => {
      if (item?.fields?.base_url) {
        data.plugin_form[index].fields.base_url.value = "https://"+auth.shop
        data.plugin_form[index].fields.base_url.type = "text"
      }
      if (item?.fields?.token) {
        data.plugin_form[index].fields.token.value = auth.accessToken
        data.plugin_form[index].fields.token.type = 'text'
      }
    })
    // console.log(data, "data changed")
    const form = await fetch("https://main.dev.saasintegrator.online/api/v1/menus", requestOptions);
    if (!form.ok) {
      throw new Error(`HTTP error! status: ${form.status}`);
    }
    const form_data = await form.json();
    console.log('form_data ', form_data);

    return { form: form_data, data: data, auth: auth, store: store };
  } catch (error) {
    console.error("Error fetching config-form:", error);
    throw error;
  }
};


export default function configPage() {
  const [isFirstButtonActive, setIsFirstButtonActive] = useState(true);
  const [inputValues, setInputValues] = useState({});
  const [radioValues, setRadioValues] = useState({});
  const [preference, setPreference] = useState();
  const [configform, setConfig] = useState();
  const [mapping, setMapping] = useState();
  const data = useLoaderData();
  console.log("dataaaaaaaa ::", data);
  const [formData, setFormData] = useState({
  });


  const handleChangeRadio = useCallback((platformName, newValue) => {
    setRadioValues(prevState => ({
      ...prevState,
      [platformName]: newValue
    }));
  }, []);

  // const handleChange = useCallback((value, name) => {
  //   setInputValues(prevState => ({
  //     ...prevState,
  //     [name]: value
  //   }));


  //   if (name === "rex_domain_url") {
  //     setFormData((prevState) => ({
  //       ...prevState,
  //       domain_url: value
  //     }))
  //   }

  //   else if (name === "soap_username") {
  //     setFormData((prevState) => ({
  //       ...prevState,
  //       username: value
  //     }))
  //   }

  //   else if (name === "soap_password") {
  //     setFormData((prevState) => ({
  //       ...prevState,
  //       password: value
  //     }))
  //   }
  //   else if (name === "soap_client_id") {
  //     setFormData((prevState) => ({
  //       ...prevState,
  //       client_id: value
  //     }))
  //   }
  //   else if (name === "channel_id") {
  //     setFormData((prevState) => ({
  //       ...prevState,
  //       channel_id: value
  //     }))
  //   }
  //   else if (name === "primary_key") {
  //     setFormData((prevState) => ({
  //       ...prevState,
  //       primary_key: value
  //     }))
  //   }
  //   else if (name === "secondary_key") {
  //     setFormData((prevState) => ({
  //       ...prevState,
  //       secondary_key: value
  //     }))
  //   }
  //   else if (name === "base_url") {
  //     setFormData((prevState) => ({
  //       ...prevState,
  //       base_url: value
  //     }))
  //   }
  //   else if (name === "token") {
  //     setFormData((prevState) => ({
  //       ...prevState,
  //       token: value
  //     }))
  //   }

  //   console.log("value :::::::::::", value)
  //   console.log("name :::::::::::", name)
  // }, []);

  const handleSelectChange = useCallback((name, value) => {
    setInputValues(prevState => ({
      ...prevState,
      [name]: value
    }));
  }, []);

  const [product, setProduct] = useState(data.data);
  const [navbar, setNavbar] = useState(null);
  // console.log('testubgssss ', data)
  const form = data.form;
  const store = data.store;

  const handleFirstButtonClick = useCallback(() => {
    console.log('datadatadatadatadata ', data)
    setProduct(data.data);
    setNavbar(null);
    if (isFirstButtonActive) return;

    setIsFirstButtonActive(true);
  }, [isFirstButtonActive]);

  const handleSecondButtonClick = useCallback(() => {
    setNavbar(true);
    setProduct(null);
    // setConfig(null);
    if (!isFirstButtonActive) return;
    setIsFirstButtonActive(false);
  }, [isFirstButtonActive]);

  // useEffect(() => {
  //   if (isFirstButtonActive && data) {
  //     // Call your function here when isFirstButtonActive is true
  //     calltogeneral(data);
  //   }
  // }, [isFirstButtonActive, data]);

  // const calltogeneral = async (formdatas) => {
  //   // console.log('testings', formdatas.store.token)
  //   const myHeaders = new Headers();
  //   myHeaders.append("Authorization", "Bearer " + formdatas.store.token);

  //   const requestOptions = {
  //     method: "GET",
  //     headers: myHeaders,
  //     redirect: "follow",
  //   };

  //   try {
  //     const response = await fetch("https://main.dev.saasintegrator.online/api/v1/credential-form", requestOptions);
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }
  //     let data = await response.json();
  //     console.log('data ', data);

  //     data.plugin_form.map((item, index) => {
  //       if (item?.fields?.base_url) {
  //         data.plugin_form[index].fields.base_url.value = formdatas.auth.shop;
  //         data.plugin_form[index].fields.base_url.type = "hidden";
  //       }
  //       if (item?.fields?.token) {
  //         data.plugin_form[index].fields.token.value = formdatas.auth.accessToken;
  //         data.plugin_form[index].fields.token.type = 'hidden';
  //       }
  //     });
  //     setProduct(data);
  //     console.log('productssss   ', product);

  //   } catch (error) {
  //     console.error('Error:', error);
  //   }
  // };

  const items = [];
  form.map((item) => {
    var jj = {
      content: item.name,
      suffix: <Icon source={ChevronRightIcon} />,
      onAction: () => handleItemClick(item.module)
    }
    items.push(jj);
  })

  async function handleItemClick(itemContent) {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + data.store.token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };
    console.log(`Item clicked: ${itemContent}`);
    try {
      /******************************************************************************************** */
      const response = await fetch(`https://main.dev.saasintegrator.online/api/v1/${itemContent}/preference`, requestOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let preference = await response.json();
      console.log('preference ', preference)
      setPreference(preference)
      /******************************************************************************************** */
      const response2 = await fetch(`https://main.dev.saasintegrator.online/api/v1/${itemContent}/config-form`, requestOptions);
      if (!response2.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let configform = await response2.json();
      console.log('config ', configform)
      setConfig(configform)
      /******************************************************************************************** */
      const response3 = await fetch(`https://main.dev.saasintegrator.online/api/v1/${itemContent}/mapping`, requestOptions);
      if (!response3.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let mapping = await response3.json();
      console.log('mapping ', mapping)
      setMapping(mapping)
    } catch (error) {
      console.error("Error fetching config-form:", error);
      throw error;
    }


    // You can add any other logic you need here
  }

  useEffect(() => {
    if (product && product.plugin_form) {
      const preFilledData = {};
      product.plugin_form.forEach(plugin => {
        Object.entries(plugin.fields).forEach(([fieldKey, field]) => {
          if (field.value && !formData[fieldKey]) {
            preFilledData[fieldKey] = field.value;
          }
        });
      });
      setFormData(prevState => ({
        ...prevState,
        ...preFilledData
      }));
    }
  }, [product]);

  // console.log("formData ::::", formData)

  const handleChange = useCallback((value, name) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  }, []);


  const handleSubmit = (event) => {
    event.preventDefault();

    if (navbar === null || navbar === false) {
      checkData(formData, data?.data?.plugin_form);
    }
    // const formData = {
    //   ...inputValues,
    //   ...radioValues
    // };
    // console.log("submit formData ::::", formData);
  };

  const checkData = (formData, apiData) => {
    let transformedData = apiData?.map(plugin => {
      let credential_values = {};
      for (let key in plugin.fields) {
        credential_values[key] = formData[key] || null;
      }
      return {
        "plugin_id": plugin.plugin_id,
        "credential_values": credential_values
      };
    });
    
    transformedData.push({
      "plugin_id": "general",
      "credential_values": {
        "custom_name": apiData?.store?.shop
      }
    });


    const myHeaders = new Headers();
  myHeaders.append("Authorization", "Bearer "+ apiData?.store?.token);
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify(transformedData);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

fetch("https://main.dev.saasintegrator.online/api/v1/credential-form", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));

    console.log("Transformed Data ::", transformedData);
    return transformedData;

    console.log("checkData formData ::", apiData.store);
    // console.log("checkData apiData ::", apiData);
  }





  async function savePrference(label) {
    try {
      console.log('Selected label:', label);
      const isEnabled = label === 'Enable' ? 1 : 0
      console.log('Is enabled:', isEnabled);


      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + data.store.token);
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        "enable": isEnabled,
        "main_plugin": "sid_9o92t6cjz6wnw78vji4ld"
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

      const response = await fetch("https://main.dev.saasintegrator.online/api/v1/category/save-preference", requestOptions);
      const result = await response.text();
      console.log(result, "checking");
    } catch (error) {
      console.error('SavePreference Error : ', error);
    }
  }


  const savePreference = (label) => {
    const isEnabled = label === 'Enable' ? 1 : 0;
    setPredData(isEnabled)
    console.log('Selected label:', label);
    console.log('Is enabled:', isEnabled);
  };




  return (
    <div style={{ display: 'flex', gap: '2rem', marginLeft: '1.9rem' }}>

      {navbar && (
        <>
          <ActionList
            actionRole="menuitem"
            items={items}
          />
        </>
      )}
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

            {preference && preference != undefined && configform != null && navbar ? (
              <>
                <Layout.Section>
                  <Card title="PReference">
                    <FormLayout>
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }} >
                        {preference?.form?.map((field) => (
                          <div style={{ width: '48%' }}>
                            {(() => {
                              switch (field.input_type) {
                                case 'url':
                                  return (
                                    <TextField
                                      label={field.label}
                                      value={inputValues[field.name] || field.value}
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
                                      value={inputValues[field.name] || field.value}
                                      onChange={(value) => handleChange(value, field.name)}
                                      name={field.name}
                                      type={field.type}
                                      required={field.required}
                                      helpText={field.description}
                                    />
                                  );
                                case "select":
                                  return (
                                    <>
                                      {field?.options.length > 0 &&


                                        <Select
                                          label={field.label}
                                          options={field.options}
                                        // onChange={handleSelectChange}
                                        // value={selected}
                                        />


                                      }
                                    </>
                                  );
                                case "radio":
                                  return (
                                    <>
                                      <Text as="h2" variant="bodyMd">
                                        {field.description}
                                      </Text>
                                      {field?.options?.map((option) => (

                                        <RadioButton
                                          // label={option.label}
                                          // // helpText={field.label}
                                          // // checked={option.value === 'disabled'}
                                          // id={field.id}
                                          // name={field.name}
                                          // value={option.value}
                                          // // onChange={handleChange}


                                          key={option.value}
                                          label={option.label}
                                          id={field.id}
                                          name={field.name}
                                          value={option.value}
                                          // checked={selectedValue === option.value}
                                          onChange={(e) => savePreference(e, option.label)}
                                        />
                                      ))}
                                    </>
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













                {/* ))} */}
                {configform?.config_form?.map((mango) => (
                  <>
                    {mango?.fields.length > 0 && (
                      <Layout.Section>
                        <Card title="configform">
                          <FormLayout>
                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }} >
                              {mango?.fields?.map((field) => (
                                // <Card type={field.input_type} field={field} />
                                <div style={{ width: '48%' }}>
                                  {(() => {
                                    switch (field.input_type) {
                                      case 'url':
                                        return (
                                          <TextField
                                            label={field.label}
                                            value={inputValues[field.name] || field.value}
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
                                            value={inputValues[field.name] || field.value}
                                            onChange={(value) => handleChange(value, field.name)}
                                            name={field.name}
                                            type={field.type}
                                            required={field.required}
                                            helpText={field.description}
                                          />
                                        );
                                      case "select":
                                        return (
                                          <>
                                            {field?.options.length > 0 &&


                                              <Select
                                                label={field.label}
                                                options={field.options}
                                              // onChange={handleSelectChange}
                                              // value={selected}
                                              />


                                            }
                                          </>
                                        );
                                      case "radio":
                                        return (
                                          <>
                                            <Text as="h2" variant="bodyMd">
                                              {field.label}
                                            </Text>
                                            {field?.options?.map((option) => (
                                              <RadioButton
                                                label={option.label}
                                                // helpText={field.label}
                                                // checked={option.value === 'disabled'}
                                                id={field.id}
                                                name={field.name}
                                                value={option.value}
                                              // onChange={handleChange}
                                              />
                                            ))}
                                          </>
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
                    )}
                  </>
                ))}


              </>
            ) : (

              <>
                {/* <FormLayout>
                  {product?.plugin_form?.map((plugin, index) => (
                    <Layout.Section key={index}>
                      <Card title={plugin.label}>

                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }} >
                          {Object.entries(plugin.fields).map(([fieldKey, field]) => (
                            <div style={{ width: '48%' }}>
                              {(() => {
                                switch (field.type) {
                                  case 'url':
                                    return (
                                      <TextField
                                        label={field.label}
                                        value={inputValues[field.name] || field.value}
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
                                        value={inputValues[field.name] || field.value}
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


                      </Card>
                    </Layout.Section>
                  ))}
                </FormLayout> */}

                <FormLayout>
                  {product?.plugin_form?.map((plugin, index) => {
                    // console.log("plugin?.fields?.token :::", plugin?.fields?.token)
                    return (
                      <div style={{ display: plugin.fields?.token != undefined || plugin?.fields?.token != null ? "none" : "block" }}>
                        <Layout.Section key={index}>
                          <Card title={plugin.label}>

                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }} >
                              {Object.entries(plugin.fields).map(([fieldKey, field]) => {
                                // console.log("fieldKey :::", fieldKey)
                                return (
                                  <div style={{ width: '48%' }}>


                                    {(() => {
                                      switch (field.type) {
                                        case 'url':
                                        case 'text':
                                        case 'hidden':
                                        case 'password':
                                          return (
                                            <TextField
                                              label={field.label}
                                              value={formData[fieldKey] || field.value}
                                              onChange={(value) => handleChange(value, fieldKey)}
                                              name={fieldKey}
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
                                )
                              })}
                            </div>


                          </Card>
                        </Layout.Section>
                      </div>
                    )
                  })}
                </FormLayout>
              </>

            )}
          </Layout>
        </Page>
      </form>
    </div>
  );
}