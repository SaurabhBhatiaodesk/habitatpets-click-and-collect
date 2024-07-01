import React, { useState, useEffect } from 'react';
import { Select } from "@shopify/polaris"; // Replace with your actual UI library

const SelectComponent = ({ field, inputValues, handleconfigChange, mango }) => {
  const [selectedValue, setSelectedValue] = useState('');

  useEffect(() => {
    // Ensure inputValues is defined before accessing it
    const initialValue = inputValues?.[mango?.plugin_id]?.[field.name] || field.value || '';
    setSelectedValue(initialValue);
  }, [inputValues, field.name, field.value, mango?.plugin_id]);

  const handleChange = (value) => {
    setSelectedValue(value);
    handleconfigChange(value, field.name, mango?.plugin_id);
  };

  return (
    <Select
      name={field.name}
      label={field.label}
      options={field.options}
      onChange={handleChange}
      value={selectedValue}
      required={field.required}
      helpText={field.description}
    />
  );
};

export default SelectComponent;
