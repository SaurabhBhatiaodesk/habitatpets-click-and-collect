import React, { useState, useEffect } from 'react';
import { RadioButton, Text } from "@shopify/polaris";

const RadioGroupComponent = ({ field, inputValues, handleconfigChange, mango, error }) => {
  const [selectedValue, setSelectedValue] = useState('');
  const [showError, setShowError] = useState('');

  useEffect(() => {
    // Ensure inputValues and inputValues.general are defined before accessing them
    const initialValue = inputValues?.[mango?.plugin_id]?.[field.name] || '';
    setSelectedValue(initialValue);
    error?.map((e)=>{
      if(field?.name==e?.name){
          console.log('"This field is Required"',field.name);
        setShowError("This field is Required");
      }
    })
  }, [inputValues, field.name, error]);

  const handleChange = (value) => {
    setSelectedValue(value);
    handleconfigChange(value, field.name, mango?.plugin_id);
  };

  return (
    <>
  
      <Text as="h2" variant="bodyMd">
        {field.label}
      </Text>
      <div style={{display: "flex", gap: "12px"}}>
        {field?.options?.map((option) => (
          <RadioButton
            key={option.value}
            label={option.label}
            checked={selectedValue === option.value}
            id={field.id}
            name={field.name}
            value={option.value}
            required={field.required}
            onChange={() => handleChange(option.value)}
            requiredIndicator={field.required}
          />
        ))}
        <span style={{ color: "red" }}>{showError}</span>
      </div>
    </>
  );
};

export default RadioGroupComponent;
