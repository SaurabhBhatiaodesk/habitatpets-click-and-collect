import React,{useState, useCallback} from 'react';
import {
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
import { json } from "@remix-run/node";
import { useLoaderData } from '@remix-run/react';
export const action=async({request})=>{
  const formData = await request.formData();
  console.log(formData);
  // Using for...of loop
for (const [key, value] of formData.entries()) {
  console.log(`Key: ${key}, Value: ${value}`);
}

// Using forEach method
formData.forEach((value, key) => {
  console.log(`Key: ${key}, Value: ${value}`);
});
  const name = formData.get("visitorsName");
  return json({ message: `Hello, ${name}` });
}
export const loader=async({request})=>{
  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Bearer KRXB192284InWrLexCVXSQbiNOd90RfF3KT4irSmphw-sD40kxr1oVpZHMtvdrVvvUbA9jy7o3");
  
  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
  };
  
  try {
    const response = await fetch("https://main.dev.saasintegrator.online/api/v1/credential-form", requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("JSON response: " + JSON.stringify(data),data);

    const form= await fetch("https://main.dev.saasintegrator.online/api/v1/product/config-form", requestOptions);
    if(!form.ok){
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const form_data = await form.json();
    console.log("JSON response: " + JSON.stringify(form_data),form_data);
    let returnData = {};
    returnData['form'] = form_data;
    returnData['data'] = data;
    return returnData;
  } catch (error) {
    console.error("Error fetching product preference:", error);
    throw error; // Propagate the error to the caller
  }
}
export default function ApiPage() {
  const [isFirstButtonActive, setIsFirstButtonActive] = useState(true);
  const [inputValues, setInputValues] = useState({});
  const [radioValues, setRadioValues] = useState({});

  const handleChangeRadio = useCallback(
    (platformName, newValue) => {
      setRadioValues(prevState => ({
        ...prevState,
        [platformName]: newValue
      }));
    },
    [],
  );

  const handleChange = useCallback(
    (event) => {
      const { name, value } = event.target;
      setInputValues(prevState => ({
        ...prevState,
        [name]: value
      }));
    },
    [],
  );

  const handleSelectChange = useCallback(
    (name, value) => {
      setInputValues(prevState => ({
        ...prevState,
        [name]: value
      }));
    },
    [],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = {
      ...inputValues,
      ...radioValues
    };
    console.log(formData); // Do something with the form data, like submit it
  };

  const data = useLoaderData();
  const product = data.data;
  const form = data.form;
  console.log(product, "product", form);

  const handleFirstButtonClick = useCallback(() => {
    if (isFirstButtonActive) return;
    setIsFirstButtonActive(true);
  }, [isFirstButtonActive]);

  const handleSecondButtonClick = useCallback(() => {
    if (!isFirstButtonActive) return;
    setIsFirstButtonActive(false);
  }, [isFirstButtonActive]);

  return (
    <>
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

            {product &&
              product.form &&
              product.form.map((platform, index) => (
                <Layout.Section key={index}>
                  {(() => {
                    switch (platform.input_type) {
                      case 'Platform 1':
                        return (
                          <FormLayout.Group condensed key={index}>
                            <TextField
                              value={inputValues[platform.name] || ''}
                              onChange={handleChange}
                              name={platform.name}
                              label={platform.label}
                              type="text"
                              autoComplete=""
                            />
                            <TextField
                              value={inputValues['primary_key'] || ''}
                              onChange={handleChange}
                              name="primary_key"
                              label="Primary Key"
                              type="text"
                            />
                          </FormLayout.Group>
                        );
                      case 'radio':
                        return (
                          <Card condensed key={index}>
                            {platform.options &&
                              platform.options.map((option, optionIndex) => (
                                <Card condensed key={optionIndex}>
                                  <RadioButton
                                    label={option.label}
                                    checked={
                                      radioValues[platform.name] === option.value
                                    }
                                    id={`${platform.name}_${optionIndex}`}
                                    name={platform.name}
                                    onChange={() =>
                                      handleChangeRadio(platform.name, option.value)
                                    }
                                    value={option.value}
                                  />
                                </Card>
                              ))}
                            <Text as="h2" variant="bodyMd">
                              {platform.description}
                            </Text>
                          </Card>
                        );
                      case 'select':
                        return (
                          <FormLayout.Group condensed key={index}>
                            <Select
                              label={platform.label}
                              options={platform.options}
                              onChange={(value) => handleSelectChange(platform.name, value)}
                              value={inputValues[platform.name] || ''}
                              name={platform.name}
                            />
                          </FormLayout.Group>
                        );
                      default:
                        return null;
                    }
                  })()}
                </Layout.Section>
              ))}

            {form &&
              form.config_form &&
              form.config_form.map((array, index) => (
                <Layout.Section key={index}>
                  <Card>
                    <FormLayout>
                      {array.fields.map((field, key) => (
                        <React.Fragment key={key}>
                          {key % 2 == 0 && <FormLayout.Group condensed />}
                          {(() => {
                            switch (field.input_type) {
                              case 'Platform 1':
                                return (
                                  <FormLayout.Group condensed key={index}>
                                    <TextField
                                      value={inputValues[field.name] || ''}
                                      onChange={handleChange}
                                      name={field.name}
                                      label={field.label}
                                      type="text"
                                      autoComplete=""
                                    />
                                    <TextField
                                      value={inputValues['primary_key'] || ''}
                                      onChange={handleChange}
                                      name="primary_key"
                                      label="Primary Key"
                                      type="text"
                                    />
                                  </FormLayout.Group>
                                );
                              case 'radio':
                                return (
                                  <Card condensed key={index}>
                                    {field.options &&
                                      field.options.map((option, optionIndex) => (
                                        <Card condensed key={optionIndex}>
                                          <RadioButton
                                            label={option.label}
                                            helpText={field.description}
                                            checked={
                                              radioValues[field.name] === option.value
                                            }
                                            id={`${field.name}_${optionIndex}`}
                                            name={field.name}
                                            onChange={() =>
                                              handleChangeRadio(field.name, option.value)
                                            }
                                            value={option.value}
                                          />
                                        </Card>
                                      ))}
                                    {field.label}
                                  </Card>
                                );
                              case 'select':
                                return (
                                  <FormLayout.Group
                                    condensed
                                    key={index}
                                  >
                                    <Select
                                      label={field.label}
                                      options={field.options}
                                      onChange={(value) => handleSelectChange(field.name, value)}
                                      value={inputValues[field.name] || ''}
                                      name={field.name}
                                    />
                                  </FormLayout.Group>
                                );
                              default:
                                return null;
                            }
                          })()}

                          {key % 2 != 0 || key == array.fields.length - 1 ? (
                            <FormLayout.Group condensed />
                          ) : null}
                        </React.Fragment>
                      ))}
                    </FormLayout>
                  </Card>
                </Layout.Section>
              ))}
          </Layout>
        </Page>
      </form>
    </>
  );
}





function Code({ children }) {
  return (
    <Box
      as="span"
      padding="025"
      paddingInlineStart="100"
      paddingInlineEnd="100"
      background="bg-surface-active"
      borderWidth="025"
      borderColor="border"
      borderRadius="100"
    >
      <code>{children}</code>
    </Box>
  );
}
