import React, { useState, useEffect, useCallback } from 'react';
import { LegacyCard, Checkbox, Select } from "@shopify/polaris";

const MAPPING = ({ mapping, plugin, preference }) => {
  const [inputValue, setInputValue] = useState('');
  const [value, setValue] = useState();
  const [selectValue, setSelectValue] = useState();
  const [checked, setChecked] = useState(false);
  const [plugin2, setPlugin2] = useState();
  const [selectedValue, setSelectedValue] = useState('');
  let field = {};

  const handleChange = useCallback(
    (id) => {
      setChecked((prevChecked) => ({
        ...prevChecked,
        [id]: !prevChecked[id], // Toggle checkbox state for the given id
      }));
    },
    [],
  );

  const pref = preference.form.slice(1, 2)[0].options;
  const opt = { [pref[0].value]: pref[0].label, [pref[1].value]: pref[1].label };
  const checkboxHeader = opt[plugin];

  useEffect(() => {
    setValue(mapping?.[plugin]);
    pref.filter((p) => p.value !== plugin).map((get) => {
      setSelectValue(mapping?.[get.value]);
      setPlugin2(get.label);
    });
  }, [mapping]);

  field.options = [{ label: "Select Value", value: "" }];
  selectValue?.map((v) => {
    field.label = `[${plugin2}]`;
    field.name = `${v.id}`;
    field.options.push({ label: v.name, value: v.id });
  });

  const handleSelectChange = (id, selectedOption) => {
    setSelectedValue((prevSelectedValue) => ({
      ...prevSelectedValue,
      [id]: selectedOption,
    }));
  };

  return (
    <>
      <LegacyCard title="Mapping" sectioned>
        {value?.map((v) => (
          <div key={v.id} style={{ border: "5px solid", borderRadius: "27px", margin: "10px", padding: "20px" }}>
            <Checkbox
              label={`${v.name} [${checkboxHeader}]`}
              checked={checked[v.id] || false}
              onChange={() => handleChange(v.id)}
            />
            <Select
              name={`${field.name}:${v.id}`}
              label={`${field.label} - ${v.name}`}
              options={field.options}
              onChange={(selectedOption) => handleSelectChange(v.id, selectedOption)}
              value={selectedValue[v.id]}
              disabled={!checked[v.id]}
            />
          </div>
        ))}
      </LegacyCard>
    </>
  );
};

export default MAPPING;
