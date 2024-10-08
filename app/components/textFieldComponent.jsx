import React, { useState, useEffect } from 'react';
import { TextField, Button, Text } from "@shopify/polaris";
import { PlusIcon, MinusIcon } from '@shopify/polaris-icons';

const TextFieldComponent = ({ field, inputValues, handleconfigChange, mango, error, setHideshow }) => {
  const [fields, setFields] = useState([{ value: '' }]); // For multiple fields
  const [singleField, setSingleField] = useState(''); // For single field
  const [showError, setShowError] = useState('');
  const [show, setShow] = useState(true);

  useEffect(() => {
    console.log("inputValues", inputValues);

    // Handle initial values based on whether the field is cloneable or not
    const fieldValue = inputValues?.[mango?.plugin_id]?.[field.name] || field?.value || '';
    const initialValues = Array.isArray(fieldValue)
      ? fieldValue
      : (typeof fieldValue === 'string' ? fieldValue.split(',') : [fieldValue]);

    // Check if the field is cloneable (multiple values) or not
    if (field.is_cloneable) {
      // Initialize fields for multiple values
      setFields(
        initialValues.map(value => ({
          value: typeof value === 'string' ? value.trim() : ''
        }))
      );
      
    } else {
      // Initialize single field value
      setSingleField(initialValues[0] || ''); // Use the first value if multiple values are returned
    }

    const fieldError = error?.find(e => field?.name === e?.name);
    setShowError(fieldError ? "This field is Required" : '');

    const valuesString = field.show_in_value;
    let valueToCheck = inputValues?.[mango?.plugin_id]?.[field.show_in];

    for (const key in inputValues) {
      if (inputValues?.[key]?.[field.show_in]) {
        valueToCheck = inputValues?.[key]?.[field.show_in];
      }
    }

    if (valuesString) {
      const valuesArray = valuesString.split(',');
      setShow(valuesArray.includes(valueToCheck));
      setHideshow((prevState) => ({
        ...prevState,
        [field.name]: valuesArray.includes(valueToCheck),
      }));
    }
  }, [inputValues, field.name, field.value, mango?.plugin_id, error, field.show_in, field.show_in_value]);

  const handleChange = (value, index) => {
    if (field.is_cloneable) {
      const newFields = [...fields];
      newFields[index].value = value;
      setFields(newFields);
      handleconfigChange(newFields.map(f => f.value), field.name, mango?.plugin_id);
    } else {
      setSingleField(value);
      handleconfigChange(value, field.name, mango?.plugin_id);
    }
  };

  const addField = () => {
    setFields([...fields, { value: '' }]);
  };

  const removeField = (index) => {
    if (fields.length > 1) {
      const newFields = fields.filter((_, i) => i !== index);
      setFields(newFields);
      handleconfigChange(newFields.map(f => f.value), field.name, mango?.plugin_id);
    }
  };

  return (
    <>
    <Text variant="headingMd" as="h6">
        {field.label}
      </Text>
      <div style={{display: "flex", gap: "12px"}}>
      {show && (
        <div style={{ margin: "4px" }}>
          {field.is_cloneable ? (
            // Multiple fields handling
            fields.map((fieldData, index) => (
              <div key={`${field.name}_${index}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <TextField
                  label={field.label}
                  labelHidden="true"
                  value={fieldData.value}
                  onChange={(value) => handleChange(value, index)}
                  name={`${field.name}_${index}`}
                  type={field.input_type}
                  required
                  helpText={field.description}
                  requiredIndicator={field.required}
                  error={showError ?? showError}
                />
                <span style={{ margin: "20px 0px 0px 5px", padding: "5px" }}>
                  {fields.length > 1 && (
                    <Button icon={MinusIcon} onClick={() => removeField(index)} plain />
                  )}
                  {index === fields.length - 1 && field.is_cloneable && (
                    <span style={{ marginLeft: "5px" }}>
                      <Button icon={PlusIcon} onClick={addField} plain />
                    </span>
                  )}
                </span>
              </div>
            ))
          ) : (
            // Single field handling
            <TextField
              label={field.label}
              labelHidden="true"
              value={singleField}
              onChange={handleChange}
              name={field.name}
              type={field.input_type}
              required
              helpText={field.description}
              requiredIndicator={field.required}
              error={showError ?? showError}
            />
          )}
        </div>
      )}
    </div>
    </>
  );
};

export default TextFieldComponent;
