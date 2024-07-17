import React, { useState, useEffect } from 'react';
import { Select, Button } from "@shopify/polaris";
import { PlusIcon } from '@shopify/polaris-icons';

const SelectComponent = ({ field, inputValues, handleconfigChange, mango, error }) => {
  const [fields, setFields] = useState([{ value: '' }]);
  const [showError, setShowError] = useState('');
  const [show, setShow] = useState(true);

  useEffect(() => {
    const initialValues = Array.isArray(inputValues?.[mango?.plugin_id]?.[field.name])
      ? inputValues[mango.plugin_id][field.name]
      : [field?.value || ''];

    setFields(fields => fields.length === 1 && fields[0].value === '' ? initialValues.map(value => ({ value })) : fields);

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
    }
  }, [inputValues, field.name, field.value, mango?.plugin_id, error, field.show_in, field.show_in_value]);

  const handleChange = (value, index) => {
    const newFields = [...fields];
    newFields[index].value = value;
    setFields(newFields);
    handleconfigChange(newFields.map(f => f.value), field.name, mango?.plugin_id);
  };

  const addField = () => {
    setFields([...fields, { value: '' }]);
  };

  return (
    <>
      {show && (
        <div style={{ margin: "4px" }}>
          {fields.map((fieldData, index) => (
            <div key={`${field.name}_${index}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <Select
                name={`${field.name}_${index}`}
                label={field.label}
                options={field.options}
                onChange={(value) => handleChange(value, index)}
                value={fieldData.value}
                required={field.required}
                helpText={field.description}
                requiredIndicator={field.required}
              />
              {index === fields.length - 1 && field.is_cloneable && (
                <Button icon={PlusIcon} onClick={addField} plain />
              )} 
            </div>
          ))}
          <span style={{ color: "red" }}>{showError}</span>
        </div>
      )}
    </>
  );
};

export default SelectComponent;
