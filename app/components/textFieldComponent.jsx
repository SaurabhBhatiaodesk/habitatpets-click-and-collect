import React, { useState, useEffect } from 'react';
import { TextField } from "@shopify/polaris";

const TextFieldComponent = ({ field, inputValues, handleconfigChange, mango, error }) => {
  const [inputValue, setInputValue] = useState('');
  const [showError,setShowError]=useState('');
  const [show,setShow]=useState(false);

  useEffect(() => {
    console.log("error:::::::",error);
    // Ensure inputValues is defined before accessing it
    const initialValue = inputValues?.[mango?.plugin_id]?.[field.name] || field.value || '';
    setInputValue(initialValue);
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
    } else {
      setShow(false); 
    }
    
    
  }, [inputValues, field.name, field.value, mango?.plugin_id], error);

  
  const handleChange = (value) => {
    setInputValue(value);
    handleconfigChange(value, field.name, mango?.plugin_id);
  };

  return (
    <>
    {show && (
    <div style={{margin:"4px"}}>
    <TextField
      label={field.label}
      value={inputValue}
      onChange={handleChange}
      name={field.name}
      type={field.input_type}
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

export default TextFieldComponent;
