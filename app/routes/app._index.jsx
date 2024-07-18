import React, { useState, useCallback, useEffect } from "react";
import { Spinner, LegacyCard, Icon, Card, Layout, Page, Text, Button, ButtonGroup, TextField, Select, RadioButton, FormLayout, ActionList, Badge,InlineStack } from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { ChevronRightIcon,CheckIcon } from "@shopify/polaris-icons";
import NotificationBar from "../components/NotificationBar";
import RadioGroupComponent from "../components/radioGroupComponent";
import TextFieldComponent from "../components/textFieldComponent";
import SelectComponent from "../components/selectComponent";
import MAPPING from "../components/MAPPING";

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
    const myHead = new Headers();
    myHead.append("Authorization", "Bearer " + store.token);

    const requestOpt = {
      method: "GET",
      headers: myHead,
      redirect: "follow"
    };

    const connection = await fetch("https://main.dev.saasintegrator.online/api/v1/user-connection?email=" + store.email, requestOpt);
    if(!connection.ok)
    {
      throw new Error("Couldn't connect to" + connection.status)
    }
    const user = await connection.json();
    const user_data = user.connection.filter(u => u.uid==store.uid);
    console.log(user_data);
    return { form: form_data, data: data, auth: auth, store: store, user_data: user_data[0]};
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
  const [preCheckedED, setPreCheckedED] = useState();
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationMessageError, setNotificationMessageError] = useState("");
  const [notificationMessageInfo, setNotificationMessageInfo] = useState("");
  const [preferenceActiveTab, setPreferenceActiveTab] = useState("");
  const [selectedValue, setSelectedValue] = useState('');
  const [dataLimit, setDataLimit] = useState({ start: 1, end: 2 });
  const [navbar, setNavbar] = useState(null);
  const [formData, setFormData] = useState({});
  const [configPreFill, setConfigPreFill] = useState({});
  const data = useLoaderData();
  const [product, setProduct] = useState(data.data);
  const form = data?.form;
  const store = data?.store;
  const user_data = data?.user_data;
  const items = [];
  const [loader, setLoader] = useState("");
  const [required, setRequired] = useState();
  const [showerror, setError] = useState();
  const [cerror, setCerror] = useState([]);
  const [loading, setLoading] = useState({});
  

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

  // useEffect(() => {
  //   return null
  // }, [inputValues]);


  const handleFirstButtonClick = useCallback(() => {
    console.log("handleFirstButtonClick ", data);
    setProduct(data.data);
    setNavbar(false);
    if (isFirstButtonActive) return;

    setIsFirstButtonActive(true);
  }, [isFirstButtonActive]);

  const handleSecondButtonClick = useCallback(() => {
    setNavbar(true);
    setProduct(null);
    handleItemClick("store");
    // setConfig(null);
    if (!isFirstButtonActive) return;
    setIsFirstButtonActive(false);
  }, [isFirstButtonActive]);

  form.map((item) => {
    var jj = {
      content: item.name,
      tone: item.module==preferenceActiveTab?"primary":"secondary",
      suffix: item.is_configured?(<Icon source={CheckIcon} tone="textSuccess" />):null,
      prefix: <Icon source={ChevronRightIcon} />,
      onAction: () => handleItemClick(item.module),
    };
    items.push(jj);
  });
  const handleSelectChange = (value) => {
    setSelectedValue(value);
  };
  async function handleItemClick(itemContent) {

    setDataLimit({ start: 0, end: 2 });
    setLoader('prefyes');
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
      setLoader('prefno');
      setLoader('configyes');
      if(preference.meta.is_enabled) {
        setDataLimit({ start: 0, end: 2 });
      }
      else{
        setDataLimit({ start: 0, end: 1 });
      }
      if(preference?.meta?.is_enabled){
      /****************************************** config-form  ************************************************** */
      const response2 = await fetch(
        `https://main.dev.saasintegrator.online/api/v1/${itemContent}/config-form`,
        requestOptions,
      );
      if (!response2.ok) {
        setLoader('configno');
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const requireds = [];
      let PluginID = '';
      let configform = await response2.json();
      configform?.config_form?.map((config) => {
        console.log(config, "CCCCCCCCCCCCCCCCCCCOOOOOOOONNNNNFIFFFFFGGF")
        PluginID = config.plugin_id;
        console.log("PluginIDPluginID", PluginID)
        config?.fields?.map((cf) => {
          if (cf.required) {

            const value = []
            value.push({ "plugin": PluginID, "name": cf.name })
            console.log("valueeeeeeeeee", value);
            requireds.push(value);
          }
        })
      })
      setRequired(requireds);
      console.log("required:::::", requireds);
      console.log("config ", configform);
      setConfig(configform);
      setLoader('configno');
      /**************************************** Mapping **************************************************** */
      setLoader('mapyes');
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
      setLoader('mapno');
    }
    } catch (error) {
      setLoader('mapno');
      console.error("Error fetching config-form:", error);
      throw error;
    }
    // You can add any other logic you need here
  }

  useEffect(() => {
    const initialSelectedValue = preference?.form[0].value
    setPreCheckedEnableDisable(initialSelectedValue);
    setPreCheckedED(initialSelectedValue);
    console.log("initialSelectedValue :::", initialSelectedValue);
    setPrefEnableDisable(initialSelectedValue);
   setSelectedValue(preference?.form[1].value || "");
    if (preference?.form[1].value) {
      setCredentialFormStatus(true);
    }
    else {
      if (!credentialFormStatus) {
        if(user_data?.is_plugins_connected){
          setCredentialFormStatus(true);
        }
      }
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
    let val = value;
    if(Array.isArray(value))
    {
      if(value.length>1)
      {
        val = value;
      }
      else
      {
        val = value[0];
      }
    }
    setInputValues((prev) => {
      // If the plugin_id is 'general', update the 'general' section

      return {
        ...prev,
        [plugin_id]: {
          ...prev[plugin_id],
          [field]: val,
        },
      };
    });

    // You can use 'value' and 'field' here as needed for further operations
  }, []);


  const handleSubmit = (event) => {
    console.log("formData in handlesubmit", formData);
    event.preventDefault();
    setLoading({"config_loading": true});
    if (true) {
      console.log("entered in iffff")
      checkData(formData, data);
    }
  };
  console.log("CerrorCerrorCerror:::", cerror)

  const checkData = async(formData, apiData) => {
    console.log("enteredddd");
    let credError = false;
    let push = [];
    console.log("PUSH: " , push)
    console.log("credError: " , credError)
    let transformedData = apiData?.data?.plugin_form?.map(plugin => {
      let credential_values = {};
      for (let key in plugin.fields) {
        if (key != "stocky_token") {
          credential_values[key] = formData[key] || null;
          if (credential_values[key] == null || credential_values[key] == null || credential_values[key] == "") {
            credError = true;
            push.push({ name: key })
            setLoading({"config_loading": false});
          }
        }
      }

      return {
        "plugin_id": plugin.plugin_id,
        "credential_values": credential_values
      };
    });
    console.log("PUSH: " , push)
    setCerror(push);
    transformedData.push({
      "plugin_id": "general",
      "credential_values": {
        "custom_name": apiData?.store?.shop
      }
    });
    console.log("transformedData",transformedData);

    if (!credError) {
      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + apiData?.store?.token);
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify(transformedData);
      console.log("rawwwwwwwwwwwwww",raw)

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };
      let responseData = {};

      await fetch("https://main.dev.saasintegrator.online/api/v1/credential-form", requestOptions)
        .then((response) => response.json())
        .then(async(result) => {
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
          setLoading({"config_loading": false});
          setNotificationMessage(result?.message);
          // console.log("allValid ::", allValid)
          console.log("credentialFormStatus ::", credentialFormStatus)
        })
        .catch((error) => {console.error(error); setLoading({"config_loading": false});});
    }
  }

  const handleConfigSubmit = () => {
    setLoading({"config":true});
    console.log("i", inputValues, "These values should be required", required);

    // Function to check if 'is_bidirectional_sync' matches
    // Function to check for common objects dynamically
    const getCommonObjects = (inputValues, required) => {
      let commonObjects = [];

      required.forEach(item => {
        let requiredItem = item[0]; // Access the first element in each sub-array
        if (requiredItem) {
          let { plugin, name } = requiredItem;
          let inputCategory = inputValues[plugin];

          if (inputCategory && inputCategory[name] !== undefined && inputCategory[name] == "") {
            commonObjects.push(requiredItem);
          } else if (!inputCategory) {
            commonObjects.push(requiredItem);
            console.log(`${plugin} is absent in inputValues`);
          } else if (inputCategory[name] === undefined) {
            commonObjects.push(requiredItem);
            console.log(`${name} is absent in ${plugin} of inputValues`);
          }
        }
      });


      return commonObjects;
    };

    const commonObjects = getCommonObjects(inputValues, required);
    console.log('Common Objects:', commonObjects);

    setError(commonObjects)


    if (commonObjects.length == 0) {
      // const matchedValues = required.
      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + data?.store?.token);

      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify(inputValues);

      console.log("inputValuessssssss", inputValues)

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
          setLoading({"config":false});
          setNotificationMessage(result?.message);
          setTimeout(() => {
            setNotificationMessage("")
          }, 5000);
        })
        .catch((error) =>{ console.error(error); setLoading({"config":false});});
    }

  };

  const handlePrefEnableDisable = (value, label) => {
    setPreCheckedED(value);
    if (value === 1 && label === "Enable") {
      setDataLimit(prevLimit => ({
        start: prevLimit.start,
        end: prevLimit.end + 1
      }));
      console.log("if value ::", value);
      console.log("if label ::", label);
      setPreCheckedED(1);
    } else if (value === 0 && label === "Disable") {
      setDataLimit(prevLimit => ({
        start: prevLimit.start,
        end: prevLimit.end - 1
      }));
      console.log("else if value ::", value);
      console.log("else if label ::", label);
      setPreCheckedED(0);
    }
    console.log("data limit ::", dataLimit);
  };


  const handlePreference = async () => {
    setLoading({"preference":true});
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + data?.store?.token);
    myHeaders.append("Content-Type", "application/json");
    console.log("preCheckedEDpreCheckedEDpreCheckedEDpreCheckedED ::", preCheckedED);
    if(selectedValue!="" || preCheckedED==0){
    const raw = JSON.stringify({
      "enable": preCheckedED == 0 ? false : true,
      "main_plugin": selectedValue
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
        setPreCheckedEnableDisable(preCheckedED);
        setPrefEnableDisable(preCheckedED);
        console.log("result?.status_code ",result?.status_code,"save-preference result: ", result);
        setLoading({"preference":false});
        switch(result?.status_code){
          case 500:
            setNotificationMessageError(result.message);
          break;
          case 422:
            setNotificationMessageError(result.message);
          break;
          case 200:
            setNotificationMessage(result?.message);
          break;
          default:
            setNotificationMessage(result?.message);
            break;
        }
        handleItemClick(preferenceActiveTab);
        setTimeout(() => {
          setNotificationMessage("")
        }, 5000);
      })
      .catch((error) =>{ console.error(error); setLoading({"preference":false});});
    }
    else{
      setNotificationMessageInfo("Please select Source of Truth/Main Plugin");
      setLoading({"preference":false});
      setTimeout(() => {
        setNotificationMessageInfo("")
      }, 5000);
    }
  }

  const successStyle = {
    background: "#c4f1c4",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "1rem",
    width: "100%",
    marginTop: "1rem",
  };

  const errorStyle = {
    background: "#ff9e9e",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "1rem",
    width: "100%",
    marginTop: "1rem",
  };
  const infoStyle = {
    background: "#f4f573",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "1rem",
    width: "100%",
    marginTop: "1rem",
  };

  const flexStyle = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
  }
  
  
  return (
    <div style={{ display: "flex", gap: "2rem", marginLeft: "1.9rem" }}>
      {navbar && (
        <>
          {/* <ActionList actionRole="menuitem" items={items} /> */}
          <div style={{ width: "15%"  ,float:'left' , }}>
  {items.map((item, index) => (
    <Button
      key={index}
      onClick={item.onAction}
      icon={item.prefix}
      fullWidth
      alignment="left"
      iconAlignment="left"
      textAlign = "left"
      variant={item.tone}
    >
      <div style={{ display: "flex", float:'left', width: "100%" }}>
        <span>{item.content}</span>
        {item.suffix}
      </div>
    </Button>
  ))}
</div>

        </>
      )}
      <form onSubmit={handleSubmit}>
        <Page>
          {/* <ui-title-bar title="Click & Collect">
            <button variant="primary" type="submit">
              Save
            </button>
          </ui-title-bar> */}


         

          <Layout>
            
              {credentialFormStatus && (
                <div style={{ width: "100%" }}>
                <LegacyCard title="Configuration" sectioned >
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
                </LegacyCard>
                </div>
              )}
            
            {notificationMessage !== "" && (
            <NotificationBar title={notificationMessage} style={successStyle} />
          )}
          {notificationMessageError !== "" && (
            <NotificationBar title={notificationMessageError} style={errorStyle} />
          )}
          {notificationMessageInfo !== "" && (
            <NotificationBar title={notificationMessageInfo} style={infoStyle} />
          )}
          
            <div style={{ width: "100%",marginTop:"10px",minWidth:"32pc" }}>
              {preference &&
                preference != undefined &&
                navbar ? (
                <>
                {loader=="prefyes"?(<LegacyCard title="Preference" sectioned >
                <Card title="configform"><div style={{textAlign:"center"}}><Spinner accessibilityLabel="Spinner example" size="large" /></div></Card></LegacyCard>):(
                  <LegacyCard title="Preference" sectioned primaryFooterAction={!loading.preference?{ content: 'Save Preference', onAction: () => handlePreference() }:{content:<Spinner accessibilityLabel="Spinner example" size="small" />}}>
                    <Card title="configform">
                    
                      <FormLayout>
                        <div
                          style={flexStyle}
                        >
                          {console.log("preference :::", preference)}
                          {preference?.form.slice(dataLimit.start, dataLimit.end)?.map((field) => (
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
                                            options={[{ value: '', label: 'Select source of Truth' }, ...field.options]}
                                            onChange={handleSelectChange}
                                            value={selectedValue} 
                                           // placeholder="Select source of Truth"
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
                                        <div style={{display: "flex", gap: "12px"}}>
                                        {field?.options?.map((option, index) => (
                                          <>
                                            {console.log(option.value, "option.valueoption.value")}

                                            <RadioButton
                                              key={index}
                                              label={option.label}
                                              id={field.id}
                                              name={field.name}
                                              value={option.value}
                                              // checked={option?.is_default_hide === true}
                                              checked={
                                                preCheckedED ==
                                                option.value
                                              }
                                              onChange={() =>
                                                handlePrefEnableDisable(
                                                  option.value,
                                                  option.label,
                                                )
                                              }
                                            />
                                          </>
                                        ))}
                                        </div>
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
                  </LegacyCard>
               )}
                 
                 {prefEnableDisable != 0 && loader=="configyes" && 
                    configform?.config_form?.filter(mango => mango?.fields.length > 0)?(<LegacyCard title="Config" sectioned >
                  <Card title="configform"><div style={{textAlign:"center"}}><Spinner accessibilityLabel="Spinner example" size="large" /></div></Card></LegacyCard>):(  
                  <>
                  {prefEnableDisable != 0 &&
                    configform?.config_form
                    ?.filter(mango => mango?.fields.length > 0)
                    .map((mango, index, filteredArray) => {
                      console.log("mango :::", mango);
                  
                      const isLast = index === filteredArray.length - 1;
                  
                      console.log("isLast :::", isLast);
                      console.log("index :::", index);
                      console.log("mango?.fields.length :::", mango?.fields.length);
                      return (
                        <>

                          {mango?.fields.length > 0 && (
                            <LegacyCard title={mango?.label} sectioned 
                            primaryFooterAction={isLast?!loading.config?{ content: 'Save Config', onAction: () => handleConfigSubmit() }:{ content:<Spinner accessibilityLabel="Spinner example" size="small" />}:null}>
                              <Card title="configform">
                                <FormLayout>
                                  <div
                                    style={flexStyle}
                                  >
                                    {mango?.fields?.map((field) => (
                                      // <Card type={field.input_type} field={field} />
                                      
                                      <div style={{ width: "48%" }}>
                                        {(() => {
                                          {console.log(field.input_type,"field.input_typefield.input_typefield.input_type");}
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
                                                  error={showerror}
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
                                                    error={showerror}
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
                                                  error={showerror}
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
                            </LegacyCard>
                          )}
                        </>
                      );
                    })}
                    </>
                  )}
                  {prefEnableDisable != 0 && (
                    <>
                  {loader=="mapyes"?(<LegacyCard title="Mapping" sectioned >
                    <Card title="configform"><div style={{textAlign:"center"}}><Spinner accessibilityLabel="Spinner example" size="large" /></div></Card></LegacyCard>):(
                    <>
                  <MAPPING mapping={mapping?.items} plugin={selectedValue} preference={preference} token={data?.store?.token || ''} setNotificationMessage={setNotificationMessage}  
                  preferenceActiveTab={preferenceActiveTab}  mappings={mapping}/>
                    </>
                  )}
                  </>
                )}
                </>
              ) : (
                <>
                {!navbar && (
                  <>
                  <FormLayout>
                 <LegacyCard title="" sectioned  >
                  <div style={{marginBottom: '10px'}} >
                 <Card>
                  <div style={{textAlign: 'center'}} >
                  <Badge
                    tone={credentialFormStatus ? 'success' : undefined}
                    toneAndProgressLabelOverride={`Setting is ${credentialFormStatus ? 'Connected' : 'Not Connected'}`}
                  >
                    {credentialFormStatus ? 'Connected' : 'Not Connected'}
                  </Badge>
                  </div>
        </Card>
        </div>
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
                          <Card key={index} title={plugin.label}>
                            <div
                              style={flexStyle}
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
                                              <div>
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
                                                  requiredIndicator
                                                />
                                                <>
                                                  {cerror.length > 0 && cerror.filter((e) => e.name == fieldKey).map((sh) => {
                                                    return (
                                                      <span style={{ color: 'red' }} >This field is required</span>
                                                    )
                                                  })}
                                                </>
                                              </div>
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
                      </div>
                    );
                  })}
                  </LegacyCard>
              
                  </FormLayout>
                  
                  {loading.config_loading ? (
                    <button style={{backgroundColor:"#000",color:"#fff",padding:"4px 8px",borderRadius:"10px",marginTop:"15px"}}  variant="primary">
                    <Spinner accessibilityLabel="Config Form" size="small" />
                  </button>
                  ):(
                  <button style={{backgroundColor:"#000",color:"#fff",padding:"4px 8px",borderRadius:"10px",marginTop:"15px"}}  variant="primary" type="submit">
                    Save
                  </button>
                )}
                </>
              )}
                </>
              )}
            </div>
          </Layout>
        </Page>

      </form>
    </div>
  );
}
