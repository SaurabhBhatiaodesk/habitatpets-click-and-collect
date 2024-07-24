async function fetchAccessToken(){try{const e=await fetch(`https://clickncollect-12d7088d53ee.herokuapp.com/api/get?shop=${location.hostname}`,{headers:{"Content-Type":"application/json",Accept:"application/json"}});if(!e.ok)throw new Error("Network response was not ok.");return await e.json()}catch(e){console.error("Error fetching access token:",e);throw e}}
function setCookie(name,value,days){let expires="";if(days){let date=new Date();date.setTime(date.getTime()+(days*86400000));expires="; expires="+date.toUTCString()}document.cookie=`${name}=${value}${expires}; path=/`;}
function getCookie(name){let cookies=document.cookie.split(";").map(cookie=>cookie.trim().split("="));for(let i=0;i<cookies.length;i++){if(cookies[i][0]===name){return decodeURIComponent(cookies[i][1]);}}return null;}
function toggleDropdown() { document.getElementById("myDropdown").classList.toggle("show");  }
async function getLocationsDropdown(accessToken, selectedLocation = "") {
    try {
      const testres = await fetchLocationsGraphQL(accessToken);
      const locations = testres?.data?.locations?.nodes;

      console.log('locations testres ',testres, selectedLocation)
      const destinationsArr = [];
  
      if (locations && selectedLocation != null) {
        console.log('tesinss  selectedLocation ',selectedLocation)
        for (const location of locations) {
          if (location?.address?.zip && location?.localPickupSettingsV2 != null) {
            console.log('location rrr ', location.name);
            destinationsArr.push(`${location.address.address1} ${location.address.city} ${location.address.zip} ${location.address.province} ${location.address.country}`);
          }
        }
      }

        const dropdownDiv = document.querySelector('.cls-pickuplocations-div');
            dropdownDiv.innerHTML = ''; // clear the div
          
            const dropdownSelect = document.createElement("select");
            dropdownSelect.className = "cls-pickuplocations-select";
    
      if (destinationsArr.length > 0 && selectedLocation != null) {
        const customerLocation = getCookie("customerlocation");
        const mapUrl = `https://clickncollect-12d7088d53ee.herokuapp.com/api/distance?customerlocation=${customerLocation}&destinations=${destinationsArr.join("|")}&shop=${location.hostname}`;
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
          // Create dropdown menu dynamically
      
          if (sortedLocations.length > 0) {
            // Create dropdown menu dynamically
          
            // if (location?.address?.zip && location?.localPickupSettingsV2 !== null) {
                for (const location of sortedLocations) {
                const option = document.createElement("option");
                option.value = location.id;
                option.text = `${location.name} - ${location.distanceText}`;
                dropdownSelect.appendChild(option);
                }
            //  }
      
            dropdownDiv.appendChild(dropdownSelect); // append the select element to the div
          }

        }
      }else{

        // const locations = testres.data.locations.nodes;


            for (const location of locations) {
                if (location?.address?.zip && location?.localPickupSettingsV2 !== null) {
                console.log(' location ',location)
                const option = document.createElement("option");
                option.value = location.id;
                option.text = `${location.name}`;
                dropdownSelect.appendChild(option);
                }
              }
            
        dropdownDiv.appendChild(dropdownSelect); // append the select element to the div

      }
      dropdownDiv.style.display = 'block';

      document.querySelector('.pickup-locations-dropdown-header').parentElement.classList.add('cnc-cls-headericons');
  
    //   document.querySelector(".popup-box .address-popup").style.display = "block";
    //   if (getCookie("storelocationName")) {
    //     console.log('storelocationName  not set : ', getCookie("storelocationName"))
    //   } else {
    //     document.querySelector(".popup-box .address-popup").style.display = "block";
    //     console.log('storelocationName  else : ', getCookie("storelocationName"))
    //   }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  }

  function showdropdown() {
    console.log('testings show dropdown');
       try{
            getCookie("storelocationName"); 
            const selectedLocation = getCookie("storelocationName");
            const customerLocation = getCookie("customerlocation");    document.querySelector(".location").value = customerLocation;
            fetchAccessToken().then(response => getLocationsDropdown(response.accessToken, selectedLocation)).catch(error => console.error("Error fetching locations:", error));
        }
        catch(e){
            fetchAccessToken().then(response => getLocationsDropdown(response.accessToken, null)).catch(error => console.error("Error fetching locations:", error));
        }
    }
    showdropdown();

const selectElement = document.querySelector('select.clsstorename');
selectElement.addEventListener('change', function() {
  selectedLocation = setCookie("storelocationName", this.value);
});