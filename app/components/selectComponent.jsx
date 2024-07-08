import React, { useState, useEffect } from 'react';
import { Select } from "@shopify/polaris"; // Replace with your actual UI library

const SelectComponent = ({ field, inputValues, handleconfigChange, mango,error }) => {
  const [selectedValue, setSelectedValue] = useState('');
  const [showError,setShowError]=useState(''); 
  const [show,setShow]=useState(true);

  useEffect(() => {
    // Ensure inputValues is defined before accessing it
    const initialValue = inputValues?.[mango?.plugin_id]?.[field.name] || field.value || '';
    if(initialValue=='' && field?.options[0]?.value)
    {
      handleconfigChange(field.options[0].value, field.name, mango?.plugin_id);
      setSelectedValue(field.options[0].value);
    }
    else{
    setSelectedValue(initialValue);
    }
    if(field?.name==error?.name){
 
      setShowError("This field is Required");
    }
    const valuesString = field.show_in_value;
    const valueToCheck = inputValues?.[mango?.plugin_id]?.[field.show_in];

    if (valuesString) {
      const valuesArray = valuesString.split(',');
      if (valuesArray.includes(valueToCheck)) {
        setShow(true);
      } else {
        setShow(false);
      }
    } 
  }, [inputValues, field.name, field.value, mango?.plugin_id,error]);


  
  const handleChange = (value) => {
    setSelectedValue(value);
    handleconfigChange(value, field.name, mango?.plugin_id);
  };

  return (
    <>
    {show && (
    <div style={{margin:"4px"}}>
    <Select
      name={field.name}
      label={field.label}
      options={field.options}
      onChange={handleChange}
      value={selectedValue}
      required={field.required}
      helpText={field.description}
      requiredIndicator
    />
    <span style={{color:"red"}}>{showError}</span>
    </div>
    )}
    </>
  );
};

export default SelectComponent;
