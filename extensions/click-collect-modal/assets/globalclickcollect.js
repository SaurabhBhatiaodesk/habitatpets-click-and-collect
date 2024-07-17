async function fetchData(e){try{const t=await fetch(e);if(!t.ok)throw new Error("Network response was not ok");return await t.json()}catch(e){return console.error("Error fetching data:",e),null}}
async function fetchAccessToken(){try{const e=await fetch(`https://clickncollect-12d7088d53ee.herokuapp.com/api/get?shop=${location.hostname}`,{headers:{"Content-Type":"application/json",Accept:"application/json"}});if(!e.ok)throw new Error("Network response was not ok.");return await e.json()}catch(e){console.error("Error fetching access token:",e);throw e}}
function getCookie(e){const t=document.cookie.split(";").map(e=>e.trim().split("=")),o=t.find(t=>t[0]===e);return o?decodeURIComponent(o[1]):null}function setCookie(e,t,o){let n="";o&&(n=new Date,n.setTime(n.getTime()+24*o*60*60*1e3),n="; expires="+n.toUTCString()),document.cookie=`${e}=${t}${n}; path=/`}
async function fetchLocationsGraphQL(accessToken) {    const myHeaders = new Headers();    myHeaders.append("Content-Type", "application/json");    myHeaders.append("X-Shopify-Access-Token", accessToken);
    const graphql = JSON.stringify({  query: `query MyQuery {locations(first: 10) {nodes {activatable hasActiveInventory isActive localPickupSettingsV2 { instructions pickupTime } name id address {zip provinceCode province phone longitude latitude formatted countryCode country city address2 address1 } } } }`, variables: {}});
    const requestOptions = { method: "POST", headers: myHeaders, body: graphql, redirect: "follow"};
    try { const response = await fetch("/admin/api/2024-04/graphql.json", requestOptions); if (!response.ok) throw new Error(`Request failed with status ${response.status}`); return await response.json();} catch (error) {console.error("Error fetching locations:", error); throw error;}
}
    async function getLocations(accessToken, selectedLocation = "") {
            try {      const testres = await fetchLocationsGraphQL(accessToken); 
          const locations = testres?.data?.locations?.nodes;
            const destinationsArr = []; if (locations) { for (const location of locations) { if (location.address.zip && location?.localPickupSettingsV2 != null) { console.log('location rrr ',location.name); destinationsArr.push(`${location.address.address1} ${location.address.city} ${location.address.zip} ${location.address.province} ${location.address.country}`);}}}
              if (destinationsArr.length > 0) {  const customerLocation = getCookie("customerlocation");
                document.querySelector(".location").value = customerLocation;
                const mapUrl = `https://clickncollect-12d7088d53ee.herokuapp.com/api/distance?customerlocation=${customerLocation}&destinations=${destinationsArr.join("|")}&shop=${location.hostname}`;
                const res = await fetchData(mapUrl); var count = 0;
                if (res) {  const sortedLocations = [];
                    for (let index = 0; index < locations.length; index++){ const location = locations[index]; if (location.address.zip && location?.localPickupSettingsV2 != null) {  const zipcode= location.address.zip; const  fulladdress= location.address.address1 + ' '+zipcode ;
					for (let index = 0; index < destinationsArr.length; index++) {
                            const distanceElement = res?.rows[0]?.elements[index]; const destinationAddress = destinationsArr[index]; 
                            if(destinationAddress.includes(zipcode) ){
                            if (distanceElement?.status == "OK" && distanceElement?.status != "ZERO_RESULTS"  && distanceElement?.distance?.value < 50000) {
                                const distanceText = distanceElement?.distance.text;
                                const parsedDistance = parseInt(distanceText.replace(/,/g, "").replace(" km", ""));   
                                sortedLocations.push({
                                    id: location.id,
                                    distance: parsedDistance,
                                    distanceText,
                                    origin: res.origin_addresses,
                                    ...location
                                }); } }else if (distanceElement?.status == "OK" && distanceElement?.status != "ZERO_RESULTS"  && distanceElement?.distance?.value > 1){
                                    count = count +1;
                                } }}} 
                             sortedLocations.sort((a, b) => a.distance - b.distance); 
                               renderLocations(sortedLocations, selectedLocation, count);
                }
            }
            document.querySelector(".popup-box .address-popup").style.display = "block";
            if (getCookie("storelocationName")){ console.log('storelocationName  not set : ',getCookie("storelocationName"))}
            else{ document.querySelector(".popup-box .address-popup").style.display = "block"; console.log('storelocationName  else : ',getCookie("storelocationName"))}
        } catch (error) { console.error("Error fetching locations:", error); }
    }
function renderLocations(locations, selectedLocation, count = 0) {
    const locationsContainer = document.querySelector(".popup-box .address-popup .locationss"); locationsContainer.innerHTML = "";
    if (locations.length > 0) {
        locations.forEach(location => {
            if (location.name !== "Snow City Warehouse") { const locationElement = document.createElement("div"); locationElement.classList.add("popup-inner-col");
                locationElement.innerHTML = `<div class="add"><span><input type="radio" id="${location.id}" class="locations" data-name="${location.name}" name="locations" value="HTML" ${location.name === selectedLocation ? 'checked="checked"' : ''}><label for="${location.id}">${location.name}</label></span><h4>${location.distanceText}</h4></div><ul class="order-list"><li>${location.address.country}</li> <li>Address: ${location.address.address1}</li><li>Phone: ${location.address.phone}</li> </ul><button type="submit"> <a href="https://www.google.com/maps/dir/${location.origin}/${location.address.address1} ${location.address.city} ${location.address.zip} ${location.address.province} ${location.address.country}" target="_blank"> Get Directions >> </a></button>`;
                locationsContainer.appendChild(locationElement);
            }  }); }else if(count > 0 && locations.length == 0){
                const noStoresElement = document.createElement("div"); noStoresElement.classList.add("popup-inner-col"); noStoresElement.innerHTML = '<div class="add">Stores are not available within a 50 km range </div>'; locationsContainer.appendChild(noStoresElement);
            } else { const noStoresElement = document.createElement("div"); noStoresElement.classList.add("popup-inner-col"); noStoresElement.innerHTML = '<div class="add">Stores not available for entered location</div>'; locationsContainer.appendChild(noStoresElement);}
}
function showModal() {   if(getCookie("storelocationName")){    const selectedLocation = getCookie("storelocationName");
    const customerLocation = getCookie("customerlocation");    document.querySelector(".location").value = customerLocation;
    fetchAccessToken().then(response => getLocations(response.accessToken, selectedLocation)).catch(error => console.error("Error fetching locations:", error));
        const popupModal = document.querySelector(".popup-modal"); if (popupModal) popupModal.style.display = "block";  }}
if (document.querySelector(".popup-modal")) {
    document.addEventListener("DOMContentLoaded", () => {  const storeLocation = getCookie("storelocation");
    if (!storeLocation && document.querySelector(".popup-modal")) { document.querySelector(".popup-modal").style.display = "block"; }
    document.querySelector(".popup-close-cross").addEventListener("click", event => { event.preventDefault(); const popupModal = document.querySelector(".popup-modal");  popupModal.style.display = "none"; popupModal.classList.remove("showmodal"); });
    document.querySelector(".setlocationbtn").addEventListener("click", event => { event.preventDefault(); const popupModal = document.querySelector(".popup-modal");
        popupModal.style.display = "none"; document.querySelector(".setlocationbtn").style.display = "none"; popupModal.classList.remove("showmodal");});
    document.body.addEventListener("click", event => {if (!event.target.closest(".popup-modal")) {document.querySelector(".popup-modal").style.display = "none"; }});
    document.addEventListener("click", event => {
        if (event.target.matches("button.check-btn")) { const zipcode = document.querySelector(".location").value; setCookie("customerlocation", zipcode);
            fetchAccessToken().then(response => getLocations(response.accessToken)).catch(error => console.error("Error fetching locations:", error));
        }
    });
    document.addEventListener("change", event => { if (event.target.matches(".popup-modal .address-popup input.locations")) {  document.querySelector(".setlocationbtn").style.display = "block"; setCookie("storelocationName", event.target.nextElementSibling.textContent); setCookie("storelocation", event.target.id);
        } });});  if (getCookie("storelocationName")) {  }else{ showModal(); }
}
async function getUserLocation() { const accessToken = '7a1891347cf4af'; try {const response = await fetch(`https://ipinfo.io/json?token=${accessToken}`);
        const data = await response.json(); if(getCookie("customerlocation")){ if(document.querySelector('.check-btn input.location').value == ""){  document.querySelector('.check-btn input.location').value= data.postal;
            } }else{ setCookie("customerlocation", data.postal); document.querySelector('.check-btn input.location').value= data.postal;
        } return data; } catch (error) { console.error('Error fetching IP information:', error);} } getUserLocation();