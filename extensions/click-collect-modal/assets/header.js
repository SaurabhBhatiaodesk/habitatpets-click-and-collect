async function fetchData(e){try{  const t=await fetch(e);if(!t.ok)throw new Error("Network response was not ok");return await t.json()}catch(e){return console.error("Error fetching data:",e),null}}
function setCookie(name,value,days){let expires="";if(days){let date=new Date();date.setTime(date.getTime()+(days*86400000));expires="; expires="+date.toUTCString()}document.cookie=`${name}=${value}${expires}; path=/`;}
function getCookie(name){let cookies=document.cookie.split(";").map(cookie=>cookie.trim().split("="));for(let i=0;i<cookies.length;i++){if(cookies[i][0]===name){return decodeURIComponent(cookies[i][1]);}}return null;}
async function getLocationsDropdown( selectedLocation = "") {
    try {
      const pickuplcurl = `https://clickncollect-12d7088d53ee.herokuapp.com/api/pickupLocation?shop=${location.hostname}`;
      const testres = await fetchData(pickuplcurl); 
      const locations = testres?.data?.locations?.nodes;

      const destinationsArr = [];
  
      if (locations && selectedLocation != null) {
        for (const location of locations) {
          if (location?.address?.zip && location?.localPickupSettingsV2 != null) {
              destinationsArr.push(`${location.address.address1} ${location.address.city} ${location.address.zip} ${location.address.province} ${location.address.country}`);
          }
        }
      }

      const dropdownDiv = document.querySelector('.cls-pickuplocations-div');
      dropdownDiv.innerHTML = '';
      const dropdwndiv = document.createElement("div");
      dropdwndiv.className = 'cnc-dropdwndiv';
      const delivertextdiv = document.createElement("div");
      delivertextdiv.className = 'cnc-delivertextdiv';
      
      const dropdownSelect = document.createElement("select");
      dropdownSelect.className = "cls-pickuplocations-select";
   
      const anchor = document.createElement('a');
      anchor.href = 'javascript:void(0)';
      anchor.className = 'cnc-modal-open';
      anchor.setAttribute('for', 'dropdown-icon');
      // anchor.text= 'see store info';     
       const icon = document.createElement('i');
      icon.className = 'fa fa-map-marker';
      icon.setAttribute('aria-hidden', 'true');
      icon.setAttribute('id', 'dropdown-icon');

      const lable = document.createElement('label');
      lable.className = 'cnc-dropdown-lable';
      lable.textContent = "You're Shopping"; 

      anchor.appendChild(icon);
      dropdownDiv.style.display = 'block';
      dropdownDiv.appendChild(anchor);
      
      dropdownDiv.appendChild(dropdwndiv);
      dropdwndiv.appendChild(lable);
    
      
      if (destinationsArr.length > 0 && selectedLocation != null) {
        const customerLocation = getCookie("customerlocation");
      
        const lable2 = document.createElement('label');
        lable2.className = 'cnc-dropdown-delver';
        lable2.textContent = "Delivering To"; 
  
        const delivertext = document.createElement('span');
        delivertext.className = 'cnc-dropdown-text';
        delivertext.textContent = customerLocation; 
    
        delivertextdiv.appendChild(lable2);
        delivertextdiv.appendChild(delivertext);
        dropdownDiv.appendChild(delivertextdiv);



        const mapUrl = `https://clickncollect-12d7088d53ee.herokuapp.com/api/distance?customerlocation=${customerLocation}&shop=${location.hostname}`;
        const res = await fetchData(mapUrl);
        var count = 0;
        if (res) {
          const sortedLocations = [];
          for (let index = 0; index < locations.length; index++) {
            const location = locations[index];
            if (location?.address?.zip && location?.localPickupSettingsV2 != null) {
              const zipcode = location.address.zip;
              const fulladdress = location.address.address1 + ' ' + zipcode;
              for (let index = 0; index < destinationsArr.length; index++) {
                const distanceElement = res?.rows[0]?.elements[index];
                const destinationAddress = destinationsArr[index];
                if (destinationAddress.includes(zipcode)) {
                  if (distanceElement?.status == "OK" && distanceElement?.status != "ZERO_RESULTS" && distanceElement?.distance?.value < 50000) {
                    const distanceText = distanceElement?.distance.text;
                    const parsedDistance = parseInt(distanceText.replace(/,/g, "").replace(" km", ""));
                    sortedLocations.push({
                      id: location.id,
                      distance: parsedDistance,
                      distanceText,
                      origin: res.origin_addresses,
                      ...location
                    });
                  } else if (distanceElement?.status == "OK" && distanceElement?.status != "ZERO_RESULTS" && distanceElement?.distance?.value > 1) {
                    count = count + 1;
                  }
                }
              }
            }
          }
          sortedLocations.sort((a, b) => a.distance - b.distance);
      
          if (sortedLocations.length > 0 && count > 0) {
                for (const location of sortedLocations) {
                const option = document.createElement("option");
                option.id = `${location.name}`;
                option.dataset.name = `${location.name}`;
                option.value = location.id;
                option.text = `${location.name} - (${location.distanceText})`;
                dropdownSelect.appendChild(option);
                }   
           
                dropdwndiv.appendChild(dropdownSelect); 

            dropdownDiv.style.display = 'block';
            dropdownSelect.addEventListener('change', handleDropdownChange);
          }else {

          }

         

        }
      }else{


        //     for (const location of locations) {
        //         if (location?.address?.zip && location?.localPickupSettingsV2 !== null) {
        //         // console.log(' location ',location)
        //         const option = document.createElement("option");
        //         option.value = location.id;
        //         option.text = `${location.name}`;
        //         dropdownSelect.appendChild(option);
        //         }
        //       }
            
        // dropdownDiv.appendChild(dropdownSelect); // append the select element to the div

      }

     

      document.querySelector('.pickup-locations-dropdown-header').parentElement.classList.add('cnc-cls-headericons');

    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  }

  function showdropdown() {
       try{
            // getCookie("storelocationName"); 
            const selectedLocation = getCookie("storelocationName");
            const customerLocation = getCookie("customerlocation");    document.querySelector(".location").value = customerLocation;
             getLocationsDropdown(selectedLocation);
        }
        catch(e){
             getLocationsDropdown(null);
        }

    }
    showdropdown();
    function handleDropdownChange(event){
      const selectElement = event.target;
      const selectedOption = event.target.options[event.target.selectedIndex];
      const nameValue = selectedOption.dataset.name;
      // console.log('id:',nameValue, '------',  'value:', selectElement.value, selectedOption, event.target.options);
      setCookie("storelocationName", nameValue);
      setCookie("storelocation", selectElement.value);
     }
 setInterval(function (){
  let storeLocationName = getCookie("storelocation");
	const pickupLocationSelect = document.querySelector('.cls-pickuplocations-select');
	if (pickupLocationSelect !== null && pickupLocationSelect.value !== "") {
    try {

      pickupLocationSelect.value = storeLocationName;
    }catch(e){
      getLocationsDropdown(storeLocationName);
    }
	}
 })
document.addEventListener("click", event => {
   if (event.target.classList.contains("cnc-modal-open") || event.target.id.includes("dropdown-icon")) { 
    const popupModal = document.querySelector(".popup-modal"); if (popupModal){
    // console.log('testings ');
    showModal();  
  }else {
    document.getElementsByClassName('button.cart-btn.button')[0].click();
  }

   
}
   
});  
document.querySelector(".popup-close-cross").addEventListener("click", event => {
  showdropdown();
   event.preventDefault(); const popupModal = document.querySelector(".popup-modal");
     popupModal.style.display = "none"; popupModal.classList.remove("showmodal"); 
    });