import React, { useState, useEffect } from 'react';
import { TextField } from "@shopify/polaris";

const TextFieldComponent = ({ field, inputValues, handleconfigChange, mango }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    // Ensure inputValues is defined before accessing it
    const initialValue = inputValues?.[mango?.plugin_id]?.[field.name] || field.value || '';
    setInputValue(initialValue);
  }, [inputValues, field.name, field.value, mango?.plugin_id]);

  const handleChange = (value) => {
    setInputValue(value);
    handleconfigChange(value, field.name, mango?.plugin_id);
  };

  return (
    <TextField
      label={field.label}
      value={inputValue}
      onChange={handleChange}
      name={field.name}
      type={field.input_type}
      required={field.required}
      helpText={field.description}
    />
  );
};

export default TextFieldComponent;
