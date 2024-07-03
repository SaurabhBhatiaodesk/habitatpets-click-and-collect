import React, { useState, useEffect, useCallback } from 'react';
import { LegacyCard,Checkbox } from "@shopify/polaris";

const MAPPING = ({ mapping,plugin }) => {
  const [inputValue, setInputValue] = useState('');
  const [value, setValue] = useState();
  const [checked, setChecked] = useState(false);
  const handleChange = useCallback(
    (newChecked) => setChecked(newChecked),
    [],
  );

  useEffect(() => {
    const last=mapping?.[plugin];
    setValue(last)
  }, [mapping]);

 
  console.log("value:::::::",value);
  console.log("plugin:::::::",plugin);
  console.log("mapping:::::::",mapping);
  return (
    <>
    <LegacyCard title="Mapping" sectioned>
    {value?.map((v)=>{
      return(
        <div>
        <Checkbox
      label={v.name}
      checked={checked}
      onChange={handleChange}
    />
    
    
     </div>
      )
    })}
    </LegacyCard>
    </>
  );
  
};

export default MAPPING;
