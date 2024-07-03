async function fetchData(e){try{const t=await fetch(e);if(!t.ok)throw new Error("Network response was not ok");return await t.json()}catch(e){return console.error("Error fetching data:",e),null}}
async function fetchAccessToken(){try{const e=await fetch(`https://clickncollect-12d7088d53ee.herokuapp.com/api/get?shop=${location.hostname}`,{headers:{"Content-Type":"application/json",Accept:"application/json"}});if(!e.ok)throw new Error("Network response was not ok.");return await e.json()}catch(e){console.error("Error fetching access token:",e);throw e}}
function getCookie(e){const t=document.cookie.split(";").map(e=>e.trim().split("=")),o=t.find(t=>t[0]===e);return o?decodeURIComponent(o[1]):null}function setCookie(e,t,o){let n="";o&&(n=new Date,n.setTime(n.getTime()+24*o*60*60*1e3),n="; expires="+n.toUTCString()),document.cookie=`${e}=${t}${n}; path=/`}

async function getLocations(accessToken, selectedLocation = "") {
    console.log('getLocations accessTokenaccessTokenaccessToken ',accessToken)
    try { const response = await fetch("/admin/api/2024-04/locations.json", {
            headers: { "X-Shopify-Access-Token": accessToken }
        });
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        const responseJSON = await response.json();
        const destinationsArr = responseJSON.locations
            .filter(location => location.zip)
            .map(location => `${location.address1} ${location.city} ${location.zip} ${location.province} ${location.country_name}`);
        if (destinationsArr.length > 0) {
            const customerLocation = getCookie("customerlocation");
            document.querySelector(".location").value = customerLocation;
            const mapUrl = `https://clickncollect-12d7088d53ee.herokuapp.com/api/distance?customerlocation=${customerLocation}&destinations=${destinationsArr.join("|")}&shop=${location.hostname}`;
            const res = await fetchData(mapUrl);
            if (res) {
                const sortedLocations = responseJSON.locations
                    .map((location, index) => {
                        const distanceElement = res.rows[0].elements[index];
                        if (distanceElement.status === "OK") {
                            const distanceText = distanceElement.distance.text;
                            return {
                                id: location.id,
                                distance: parseInt(distanceText.replace(/,/g, "").replace(" km", "")),
                                distanceText,
                                origin: res.origin_addresses,
                                ...location
                            };
                        }
                    })
                    .filter(Boolean)
                    .sort((a, b) => a.distance - b.distance);
                renderLocations(sortedLocations, selectedLocation);
            }
        }
        if (getCookie("storelocationName")){ 
           console.log('storelocationName  not set : ',getCookie("storelocationName"))
        }else{     
            document.querySelector(".popup-box .address-popup").style.display = "block";
            console.log('storelocationName  else : ',getCookie("storelocationName"))
        }
    } catch (error) { console.error("Error fetching locations:", error); }
}
function renderLocations(locations, selectedLocation) {
    const locationsContainer = document.querySelector(".popup-box .address-popup .locationss");
    locationsContainer.innerHTML = "";
    if (locations.length > 0) {
        locations.forEach(location => {
            if (location.name !== "Snow City Warehouse") {
                const locationElement = document.createElement("div");
                locationElement.classList.add("popup-inner-col");
                locationElement.innerHTML = `<div class="add"><span><input type="radio" id="${location.id}" class="locations" data-name="${location.name}" name="locations" value="HTML" ${location.name === selectedLocation ? 'checked="checked"' : ''}>
                            <label for="${location.id}">${location.name}</label></span><h4>${location.distanceText}</h4></div>
                    <ul class="order-list"><li>${location.country_name}</li> <li>Address: ${location.address1}</li><li>Phone: ${location.phone}</li> </ul>
                    <button type="submit"> <a href="https://www.google.com/maps/dir/${location.origin}/${location.address1} ${location.city} ${location.zip} ${location.province} ${location.country_name}" target="_blank">
                            Get Directions >> </a></button>`;
                locationsContainer.appendChild(locationElement);
            }
        });
    } else {
        const noStoresElement = document.createElement("div"); noStoresElement.classList.add("popup-inner-col");
        noStoresElement.innerHTML = '<div class="add">Stores not available for entered location</div>';
        locationsContainer.appendChild(noStoresElement);
    }
}
function showModal() {
   if(getCookie("storelocationName")){
    const selectedLocation = getCookie("storelocationName");
    const customerLocation = getCookie("customerlocation");
    document.querySelector(".location").value = customerLocation;
    fetchAccessToken()
        .then(response => getLocations(response.accessToken, selectedLocation))
        .catch(error => console.error("Error fetching locations:", error));
        const popupModal = document.querySelector(".popup-modal");
        if (popupModal) popupModal.style.display = "block";
}

}
if (document.querySelector(".popup-modal")) {
    document.addEventListener("DOMContentLoaded", () => {
    const storeLocation = getCookie("storelocation");
    if (!storeLocation && document.querySelector(".popup-modal")) {
        document.querySelector(".popup-modal").style.display = "block";
    }
    document.querySelector(".popup-close-cross").addEventListener("click", event => {
        event.preventDefault();
        const popupModal = document.querySelector(".popup-modal");
        popupModal.style.display = "none";
        popupModal.classList.remove("showmodal");
    });
    document.querySelector(".setlocationbtn").addEventListener("click", event => {
        event.preventDefault(); const popupModal = document.querySelector(".popup-modal");
        popupModal.style.display = "none"; document.querySelector(".setlocationbtn").style.display = "none"; popupModal.classList.remove("showmodal");});
    document.body.addEventListener("click", event => {if (!event.target.closest(".popup-modal")) {document.querySelector(".popup-modal").style.display = "none"; }});
    document.addEventListener("click", event => {
        if (event.target.matches("button.check-btn")) { const zipcode = document.querySelector(".location").value; setCookie("customerlocation", zipcode);
            fetchAccessToken().then(response => getLocations(response.accessToken)).catch(error => console.error("Error fetching locations:", error));
        }
    });
    document.addEventListener("change", event => {
        if (event.target.matches(".popup-modal .address-popup input.locations")) {
            document.querySelector(".setlocationbtn").style.display = "block";
            setCookie("storelocationName", event.target.nextElementSibling.textContent);
            setCookie("storelocation", event.target.id);
        }
    });
});        if (getCookie("storelocationName")) {  }else{
                showModal();
        }
}

async function getUserLocation() {
    const accessToken = '7a1891347cf4af';  // Replace with your actual access token
  
    try {
        const response = await fetch(`https://ipinfo.io/json?token=${accessToken}`);
        const data = await response.json();
        // console.log('data',data.org + ' '+ data.postal + ' '+ data.city +' ' + data.country);
        if(getCookie("customerlocation")){

        }else{
            setCookie("customerlocation", data.postal);
            document.querySelector('.popup-modal .check-btn input').value= data.postal;
        }
        
        // You can return the data or use it as needed
        return data;
    } catch (error) {
        console.error('Error fetching IP information:', error);
    }
}

// Call the function
getUserLocation();
