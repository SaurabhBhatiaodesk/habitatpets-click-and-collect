import React, { useState, useCallback, useEffect } from "react";
import { Icon, Card, Layout, Page, Text, Button, ButtonGroup, TextField, Select, RadioButton, FormLayout, ActionList } from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { ChevronRightIcon } from "@shopify/polaris-icons";
import NotificationBar from "../components/NotificationBar";
import RadioGroupComponent from "../components/radioGroupComponent";
import TextFieldComponent from "../components/textFieldComponent";
import SelectComponent from "../components/selectComponent";

// Handles form submission
export const action = async ({ request }) => {
  const formData = await request.formData();
  console.log("ffoorrmmddatataq", formData);

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
  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Bearer " + store.token);
  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const response = await fetch(
      "https://main.dev.saasintegrator.online/api/v1/credential-form",
      requestOptions,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let data = await response.json();

    data.plugin_form.map((item, index) => {
      if (item?.fields?.base_url) {
        data.plugin_form[index].fields.base_url.value = "https://" + auth.shop;
        data.plugin_form[index].fields.base_url.type = "text";
      }
      if (item?.fields?.token) {
        data.plugin_form[index].fields.token.value = auth.accessToken;
        data.plugin_form[index].fields.token.type = "text";
      }
    });
    // console.log(data, "data changed")
    const form = await fetch(
      "https://main.dev.saasintegrator.online/api/v1/menus",
      requestOptions,
    );
    if (!form.ok) {
      throw new Error(`HTTP error! status: ${form.status}`);
    }
    const form_data = await form.json();
    console.log("form_data ", form_data);

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
  const [credentialFormStatus, setCredentialFormStatus] = useState(null);
  const [prefEnableDisable, setPrefEnableDisable] = useState(null);
  const [preCheckedEnableDisable, setPreCheckedEnableDisable] = useState();
  const [notificationMessage, setNotificationMessage] = useState("");
  const [preferenceActiveTab, setPreferenceActiveTab] = useState("");

  const [navbar, setNavbar] = useState(null);
  const [formData, setFormData] = useState({});
  const [configPreFill, setConfigPreFill] = useState({});
  const data = useLoaderData();
  const [product, setProduct] = useState(data.data);
  const form = data?.form;
  const store = data?.store;
  const items = [];

  console.log("dataaaaaaaa ::", data);



  useEffect(() => {
    if (product && product.plugin_form) {
      const preFilledData = {};
      product.plugin_form.forEach((plugin) => {
        Object.entries(plugin.fields).forEach(([fieldKey, field]) => {
          if (field.value && !formData[fieldKey]) {
            preFilledData[fieldKey] = field.value;
          }
        });
      });
      setFormData((prevState) => ({
        ...prevState,
        ...preFilledData,
      }));
    }
  }, [product]);

  // useEffect to prefill data
  useEffect(() => {
    if (configform) {
      const initialValues = {};

      configform.config_form.forEach((item) => {
        const { plugin_id, saved_values } = item;
        console.log("forEach item :::::", item);
        console.log("forEach saved_values :::::", saved_values);

        if (saved_values) {
          console.log("forEach plugin_id :::::", plugin_id);
          Object.entries(saved_values).forEach(([name, value]) => {
            if (!initialValues[plugin_id]) {
              initialValues[plugin_id] = {};
            }
            initialValues[plugin_id][name] = value || '';
          });
        }
      });

      console.log("prefilled initialValues", initialValues);
      setInputValues(initialValues);
    }
  }, [configform]);

  useEffect(() => {
    console.log("prefilled inputValues", inputValues);
  }, [inputValues]);


  const handleChangeRadio = useCallback((platformName, newValue) => {
    setRadioValues((prevState) => ({
      ...prevState,
      [platformName]: newValue,
    }));
  }, []);

  const handleSelectChange = useCallback((name, value) => {
    console.log("handleSelectChange");
    setInputValues((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const handleFirstButtonClick = useCallback(() => {
    console.log("handleFirstButtonClick ", data);
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

  form.map((item) => {
    var jj = {
      content: item.name,
      suffix: <Icon source={ChevronRightIcon} />,
      onAction: () => handleItemClick(item.module),
    };
    items.push(jj);
  });

  async function handleItemClick(itemContent) {
    setPreferenceActiveTab(itemContent);
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + data.store.token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };
    console.log(`Item clicked: ${itemContent}`);
    try {
      /**************************************  Preference  ****************************************************** */
      const response = await fetch(
        `https://main.dev.saasintegrator.online/api/v1/${itemContent}/preference`,
        requestOptions,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let preference = await response.json();
      console.log("preference ", preference);
      setPreference(preference);
      /****************************************** config-form  ************************************************** */
      const response2 = await fetch(
        `https://main.dev.saasintegrator.online/api/v1/${itemContent}/config-form`,
        requestOptions,
      );
      if (!response2.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let configform = await response2.json();
      console.log("config ", configform);
      setConfig(configform);
      /**************************************** Mapping **************************************************** */
      const response3 = await fetch(
        `https://main.dev.saasintegrator.online/api/v1/${itemContent}/mapping`,
        requestOptions,
      );
      if (!response3.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let mapping = await response3.json();
      console.log("mapping ", mapping);
      setMapping(mapping);
    } catch (error) {
      console.error("Error fetching config-form:", error);
      throw error;
    }

    // You can add any other logic you need here
  }

  useEffect(() => {
    const initialSelectedValue =
      preference?.form.find((option) => option?.is_default_hide === true)
        ?.value || false;
    setPreCheckedEnableDisable(initialSelectedValue ? 0 : 1);
    console.log("initialSelectedValue :::", initialSelectedValue);
    if (initialSelectedValue === false) {
      setPrefEnableDisable(1);
    } else if (initialSelectedValue === true) {
      setPrefEnableDisable(0);
    }
  }, [preference]);


  const handleChange = useCallback((value, name) => {
    console.log("handleChange values", value, "::", name);
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const handleconfigChange = useCallback((value, field, plugin_id) => {
    console.log("handleconfigChange Value :", value);
    console.log(plugin_id, "fieldfield", field);

    setInputValues((prev) => {
      // If the plugin_id is 'general', update the 'general' section

      return {
        ...prev,
        [plugin_id]: {
          ...prev[plugin_id],
          [field]: value,
        },
      };
    });

    // You can use 'value' and 'field' here as needed for further operations
  }, []);


  const handleSubmit = (event) => {
    console.log("inputValues in handlesubmit", inputValues);
    event.preventDefault();

    if (navbar === null || navbar === false) {
      checkData(formData, data);
    }
  };

  const checkData = (formData, apiData) => {

    let transformedData = apiData?.data?.plugin_form?.map(plugin => {
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
    myHeaders.append("Authorization", "Bearer " + apiData?.store?.token);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify(transformedData);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };
    let responseData = {};

    // fetch("https://main.dev.saasintegrator.online/api/v1/credential-form", requestOptions)
    //   .then((response) => response.json())
    //   .then((result) => {
    //     responseData = result;
    //     console.log(result);
    //     console.log("responseData ::", responseData?.data);

    //     // console.log("checkData apiData ::", apiData);
    //   })
    //   .catch((error) => console.error(error));
    // // return result;


    fetch("https://main.dev.saasintegrator.online/api/v1/credential-form", requestOptions)
      .then((response) => response.json())
      .then((result) => {
        responseData = result?.data;
        console.log("result ::", result);
        console.log("responseData ::", responseData);

        // let allValid = true;
        // Iterate over each key in the data object
        for (let key in responseData) {
          if (responseData.hasOwnProperty(key)) {
            if (responseData[key].credentials_is_valid !== true) {
              // allValid = false;
              setCredentialFormStatus(false);
              break;
            } else {
              setCredentialFormStatus(true);
            }
          }
        }

        // console.log("allValid ::", allValid)
        console.log("credentialFormStatus ::", credentialFormStatus)
      })
      .catch((error) => console.error(error));

  }

  const handleConfigSubmit = () => {
    console.log("inputValues in handleConfigSubmit", inputValues);
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + data?.store?.token);

    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify(inputValues);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    fetch(`https://main.dev.saasintegrator.online/api/v1/${preferenceActiveTab}/config`, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        console.log("config result:::::::", result)
        setNotificationMessage(result?.message);
        setTimeout(() => {
          setNotificationMessage("")
        }, 5000);
      })
      .catch((error) => console.error(error));

  };


  async function savePrference(label) {
    try {
      console.log("Selected label:", label);
      const isEnabled = label === "Enable" ? 1 : 0;
      console.log("Is enabled:", isEnabled);

      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + data.store.token);
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        enable: isEnabled,
        main_plugin: "sid_9o92t6cjz6wnw78vji4ld",
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      const response = await fetch(
        "https://main.dev.saasintegrator.online/api/v1/category/save-preference",
        requestOptions,
      );
      const result = await response.text();
      console.log(result, "checking");
    } catch (error) {
      console.error("SavePreference Error : ", error);
    }
  }

  const handlePrefEnableDisable = (value, label) => {
    setPreCheckedEnableDisable(value);
    if (value === 1 && label === "Enable") {
      console.log("if value ::", value);
      console.log("if label ::", label);
      setPrefEnableDisable(1);
    } else if (value === 0 && label === "Disable") {
      console.log("else if value ::", value);
      console.log("else if label ::", label);
      setPrefEnableDisable(0);
    }
    console.log("preCheckedEnableDisable ::", preCheckedEnableDisable);

    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + data?.store?.token);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      "enable": value === 0 ? false : true,
      "main_plugin": "sid_9o92t6cjz6wnw78vji4ld"
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    fetch(`https://main.dev.saasintegrator.online/api/v1/${preferenceActiveTab}/save-preference`, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        console.log("save-preference result: ", result);
        setNotificationMessage(result?.message);
        setTimeout(() => {
          setNotificationMessage("")
        }, 5000);
      })
      .catch((error) => console.error(error));

  };

  const successStyle = {
    background: "#c4f1c4",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "1rem",
  };

  const errorStyle = {
    background: "#ff9e9e",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "1rem",
  };

  return (
    <div style={{ display: "flex", gap: "2rem", marginLeft: "1.9rem" }}>
      {navbar && (
        <>
          <ActionList actionRole="menuitem" items={items} />
        </>
      )}
      <form onSubmit={handleSubmit}>
        <Page>
          <ui-title-bar title="Click & Collect">
            <button variant="primary" type="submit">
              Save
            </button>
          </ui-title-bar>

          {credentialFormStatus != null && (
            <NotificationBar title={!credentialFormStatus
              ? "Connection not connected"
              : "Connection is connected"} style={!credentialFormStatus ? errorStyle : successStyle} />
          )}
          {notificationMessage !== "" && (
            <NotificationBar title={notificationMessage} style={successStyle} />
          )}

          <Layout>
            <Layout.Section>
              <Text as="h1" variant="headingMd">
                Configuration
              </Text>
            </Layout.Section>
            <Layout.Section>
              <ButtonGroup variant="segmented">
                <Button
                  pressed={isFirstButtonActive}
                  onClick={handleFirstButtonClick}
                >
                  General
                </Button>
                <Button
                  pressed={!isFirstButtonActive}
                  onClick={handleSecondButtonClick}
                >
                  Module Configuration
                </Button>
              </ButtonGroup>
            </Layout.Section>

            {preference &&
              preference != undefined &&
              configform != null &&
              navbar ? (
              <>
                <Layout.Section>
                  <Card title="PReference">
                    <FormLayout>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          justifyContent: "space-between",
                        }}
                      >
                        {console.log("preference :::", preference)}
                        {preference?.form?.map((field) => (
                          <div style={{ width: "48%" }}>
                            {(() => {
                              switch (field.input_type) {
                                case "url":
                                  return (
                                    <TextField
                                      label={field.label}
                                      value={
                                        inputValues[field.name] || field.value
                                      }
                                      onChange={(value) =>
                                        handleChange(value, field.name)
                                      }
                                      name={field.name}
                                      type="url"
                                      required={field.required}
                                      helpText={field.description}
                                    />
                                  );
                                case "text":
                                case "password":
                                  return (
                                    <TextField
                                      label={field.label}
                                      value={
                                        inputValues[field.name] || field.value
                                      }
                                      onChange={(value) =>
                                        handleChange(value, field.name)
                                      }
                                      name={field.name}
                                      type={field.type}
                                      required={field.required}
                                      helpText={field.description}
                                    />
                                  );
                                case "select":
                                  return (
                                    <>
                                      {field?.options.length > 0 && (
                                        <Select
                                          name={field.name}
                                          label={field.label}
                                          options={field.options}
                                        // onChange={handleSelectChange}
                                        // value={selected}
                                        />
                                      )}
                                    </>
                                  );
                                case "radio":
                                  return (
                                    <>
                                      <Text as="h2" variant="bodyMd">
                                        {field.description}
                                      </Text>
                                      {field?.options?.map((option, index) => (
                                        <RadioButton
                                          key={index}
                                          label={option.label}
                                          id={field.id}
                                          name={field.name}
                                          value={option.value}
                                          // checked={option?.is_default_hide === true}
                                          checked={
                                            preCheckedEnableDisable ===
                                            option.value
                                          }
                                          onChange={() =>
                                            handlePrefEnableDisable(
                                              option.value,
                                              option.label,
                                            )
                                          }
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

                {prefEnableDisable !== 0 &&
                  configform?.config_form?.map((mango) => {
                    console.log("mango :::", mango);
                    return (
                      <>
                        {mango?.fields.length > 0 && (
                          <Layout.Section>
                            <Card title="configform">
                              <FormLayout>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  {mango?.fields?.map((field) => (
                                    // <Card type={field.input_type} field={field} />
                                    <div style={{ width: "48%" }}>
                                      {(() => {
                                        switch (field.input_type) {
                                          case "url":
                                          case "text":
                                          case "password":
                                            return (
                                              <TextFieldComponent
                                                key={field.name}
                                                field={field}
                                                inputValues={inputValues}
                                                handleconfigChange={handleconfigChange}
                                                mango={{ plugin_id: mango?.plugin_id }}
                                              />
                                            );
                                          case "select":
                                            return (
                                              <>
                                                <SelectComponent
                                                  key={field.name}
                                                  field={field}
                                                  inputValues={inputValues}
                                                  handleconfigChange={handleconfigChange}
                                                  mango={mango}
                                                />
                                              </>
                                            );
                                          case "radio":
                                           return (
                                              <RadioGroupComponent
                                                key={field.name}
                                                field={field}
                                                inputValues={inputValues}
                                                handleconfigChange={handleconfigChange}
                                                mango={{ plugin_id: mango?.plugin_id }}
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
                        )}
                      </>
                    );
                  })}
              </>
            ) : (
              <>
                <FormLayout>
                  {product?.plugin_form?.map((plugin, index) => {
                    // console.log("plugin?.fields?.token :::", plugin?.fields?.token)
                    return (
                      <div
                        style={{
                          display:
                            plugin.fields?.token != undefined ||
                              plugin?.fields?.token != null
                              ? "none"
                              : "block",
                        }}
                      >
                        <Layout.Section key={index}>
                          <Card title={plugin.label}>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "space-between",
                              }}
                            >
                              {Object.entries(plugin.fields).map(
                                ([fieldKey, field]) => {
                                  // console.log("fieldKey :::", fieldKey)
                                  return (
                                    <div style={{ width: "48%" }}>
                                      {(() => {
                                        switch (field.type) {
                                          case "url":
                                          case "text":
                                          case "hidden":
                                          case "password":
                                            return (
                                              <TextField
                                                label={field.label}
                                                value={formData[fieldKey]}
                                                onChange={(value) =>
                                                  handleChange(value, fieldKey)
                                                }
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
                                  );
                                },
                              )}
                            </div>
                          </Card>
                        </Layout.Section>
                      </div>
                    );
                  })}
                </FormLayout>
              </>
            )}
          </Layout>
        </Page>
        <button type="button" onClick={handleConfigSubmit}>Save Config</button>
      </form>
    </div>
  );
}
