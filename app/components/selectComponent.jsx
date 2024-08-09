import React, { useState, useEffect, useCallback } from 'react';
import { Select, Button, ChoiceList } from "@shopify/polaris";
import { PlusIcon, MinusIcon } from '@shopify/polaris-icons';

const SelectComponent = ({ field, inputValues, handleconfigChange, mango, error, setHideshow }) => {
  const [fields, setFields] = useState([{ value: '' }]);
  const [showError, setShowError] = useState('');
  const [show, setShow] = useState(true);
  const [choicelistValue, setChoicelistValue] = useState([]);

  useEffect(() => {
    const pluginInputValues = inputValues?.[mango?.plugin_id] || {};
    const fieldInputValues = pluginInputValues[field.name];
    const initialValues = Array.isArray(fieldInputValues) ? fieldInputValues : [fieldInputValues || ''];

    console.log('Initial Values:', initialValues);
    if (field.multiple === false) {
      setFields(fields =>
        fields.length === 1 && fields[0].value === ''
          ? initialValues.map(value => ({ value }))
          : fields
      );
    } else {
      setChoicelistValue(initialValues);
    }
    const fieldError = error?.find(e => field?.name === e?.name);
    setShowError(fieldError ? "This field is Required" : '');

    const valuesString = field.show_in_value;
    let valueToCheck = pluginInputValues[field.show_in];

    for (const key in inputValues) {
      if (inputValues[key]?.[field.show_in]) {
        valueToCheck = inputValues[key][field.show_in];
      }
    }

    if (valuesString) {
      const valuesArray = valuesString.split(',');
      setShow(valuesArray?.includes(valueToCheck));
      setHideshow((prevState) => ({
        ...prevState,
        [field.name]: valuesArray?.includes(valueToCheck),
      }));
    }
  }, [inputValues, field.name, field.value, mango?.plugin_id, error, field.show_in, field.show_in_value]);

  const handleChange = (value, index) => {
    const newFields = [...fields];
    newFields[index].value = value;
    setFields(newFields);

    // Only update if the selected value is not blank
  //  if (value !== '') {
      handleconfigChange(newFields.map(f => f.value), field.name, mango?.plugin_id);
    //}
  };

  const handleChangec = useCallback((value, index) => {
      const newFields = [...fields];
      newFields[index].value = value;
      setFields(newFields);
      handleconfigChange(newFields.map(f => f.value), field.name, mango?.plugin_id);
    
  }, [fields, handleconfigChange, field.name, mango?.plugin_id]);

  const addField = () => {
    setFields([...fields, { value: '' }]);
  };

  console.log('Fields:', fields);
  console.log('Show:', show);

  const removeField = (index) => {
    if (fields.length > 1) {
      const newFields = fields.filter((_, i) => i !== index);
      setFields(newFields);
      handleconfigChange(newFields.map(f => f.value), field.name, mango?.plugin_id);
    }
  };

  return (
    <>
      {show && (
        <div style={{ margin: "4px" }}>
          {fields.map((fieldData, index) => (
            <div key={`${field.name}_${index}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              {field.multiple ? (
                <ChoiceList
                  allowMultiple
                  title={field.label}
                  choices={field.options}
                  selected={choicelistValue}
                  onChange={(value) => handleChangec(value, index)}
                />
              ) : (
                <Select
                  name={`${field.name}_${index}`}
                  label={field.label}
                  options={
                    field.options[0]?.value !== ''
                      ? [{ value: '', label: 'Select' }, ...field.options]
                      : field.options
                  }
                  onChange={(value) => handleChange(value, index)}
                  value={fieldData.value}
                  required={field.required}
                  helpText={field.description}
                  requiredIndicator={field.required}
                />
              )}
              {fields.length > 1 && (
                <Button icon={MinusIcon} onClick={() => removeField(index)} plain />
              )}
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
