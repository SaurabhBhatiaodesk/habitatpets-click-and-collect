async function fetchAccessToken() { try { let response = await fetch(`https://clickncollect-12d7088d53ee.herokuapp.com/api/get?shop=${location.hostname}`, { headers: { "Content-Type": "application/json", Accept: "application/json"  } });  if (!response.ok) throw new Error("Network response was not ok.");    return await response.json();  } catch (error) { console.error("Error fetching access token:", error); throw error;  }}
function setCookie(name,value,days){let expires="";if(days){let date=new Date();date.setTime(date.getTime()+(days*86400000));expires="; expires="+date.toUTCString()}document.cookie=`${name}=${value}${expires}; path=/`;}
function getCookie(name){let cookies=document.cookie.split(";").map(cookie=>cookie.trim().split("="));for(let i=0;i<cookies.length;i++){if(cookies[i][0]===name){return decodeURIComponent(cookies[i][1]);}}return null;}
async function fetchData(url) {
  try {
    let response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch data from ${url}`);
    return await response.json();
  } catch (error) { console.error("Error fetching data:", error); throw error;  }
}
async function getLocations(accessToken, selectedLocationName = "") {
  console.log('getLocations accessToken', accessToken, selectedLocationName,'selectedLocationName')
  try {
    let response = await fetch("/admin/api/2024-04/locations.json", {
      headers: { "X-Shopify-Access-Token": accessToken }
    });
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    let data = await response.json();
    console.log('getLocations accessToken',data);     let locations = [];
    for (let i = 0; i < data.locations.length; i++) {  let location = data.locations[i];
      if (location.zip) { locations.push(`${location.address1} ${location.city} ${location.zip} ${location.province} ${location.country_name}`);  } }
    let locationsElement = document.querySelector(".popup-box .address-popup .locationss");
    locationsElement.innerHTML = "";

    if (locations.length > 0) {
      let customerLocation = getCookie("customerlocation");
      document.querySelector(".location").value = customerLocation;
      let distanceApiUrl = `https://clickncollect-12d7088d53ee.herokuapp.com/api/distance?customerlocation=${customerLocation}&destinations=${locations.join("|")}&shop=${location.host}`;
      let distanceData = await fetchData(distanceApiUrl);
      let locationData = [];
      for (let i = 0; i < data.locations.length; i++) {
        let location = data.locations[i];
        if (distanceData.rows[0].elements[i].status === "OK") {
          let distanceText = distanceData.rows[0].elements[i].distance.text;
          let distanceValue = parseInt(distanceText.replace(/,/g, "").replace(" km", ""));
          locationData.push({
            ...location,
            distance: distanceValue,
            distancetext: distanceText,
            origin: distanceData.origin_addresses
          });
        }
      }
      locationData.sort((a, b) => a.distance - b.distance);
      for (let i = 0; i < locationData.length; i++) {
        let location = locationData[i];
        if (location.name !== "Snow City Warehouse") {
          let locationElement = document.createElement("div");
          locationElement.classList.add("popup-inner-col");
          locationElement.innerHTML = `
            <div class="add">
              <span> <input type="radio" id="${location.id}" class="locations" data-name="${location.name}" name="locations" value="HTML" ${selectedLocationName === location.name ? 'checked="checked"' : ""}>
                <label for="${location.id}">${location.name}</label> </span>
              <h4>${location.distancetext}</h4>  </div>
            <ul class="order-list">
              <li>${location.country_name}</li>
              <li>Address: ${location.address1}</li>
              <li>Phone: ${location.phone}</li>
            </ul>
            <button type="submit">
              <a href="https://www.google.com/maps/dir/${location.origin}/${location.address1} ${location.city} ${location.zip} ${location.province} ${location.country_name}" target="_blank">Get Directions >></a>
            </button>
          `;
          locationsElement.appendChild(locationElement);
        }
      }
    } else {
      let noStoresElement = document.createElement("div");
      noStoresElement.classList.add("popup-inner-col");
      noStoresElement.innerHTML = '<div class="add">Stores not available for entered location</div>';
      locationsElement.appendChild(noStoresElement);
    }
    document.querySelector(".popup-box .address-popup").style.display = "block";
    document.querySelector("body .popup-modal").classList.add("showmodal");
  } catch (error) { console.error("Error fetching locations:", error);  }
}
async function getInventoryLocations(accessToken, callback) {
  let productId = document.querySelector('.product-form input[name="product-id"]').value;
  let query=`query { product(id: "gid://shopify/Product/${productId}") { tags title tracksInventory collections(first: 10) { nodes { id title handle } } variants(first: 10) { nodes { inventoryItem { inventoryLevels(first: 10) { edges { node { location { activatable name } id quantities(names: "available") { name id quantity } } } } } id } } } }`;
  try {console.log('getInventoryLocations accessToken : ', accessToken.accessToken);
    let response = await fetch(`${location.origin}/admin/api/2024-04/graphql.json`, {     
      method: "POST", headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken.accessToken
      },
      body: JSON.stringify({ query: query, variables: {} })
    });
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    let data = await response.json();
    callback(null, data.data);
  } catch (error) {
    console.error("Error fetching inventory locations:", error);
    callback(error, null);
  }
}
function handleInventoryLocationsResponse(data) {
  let storeLocationName = getCookie("storelocationName");
  let productVariantId = document.querySelector(".product-form .product-variant-id").value;
  for (let i = 0; i < data.product.variants.nodes.length; i++) {
    let variant = data.product.variants.nodes[i];
    let variantIdParts = variant.id.split("/");
    let variantId = variantIdParts[variantIdParts.length - 1];
    if (variantId === productVariantId) {
      let isInStock = false;
      if (variant.inventoryItem && variant.inventoryItem.inventoryLevels) {
        for (let j = 0; j < variant.inventoryItem.inventoryLevels.edges.length; j++) {
          let inventoryLevel = variant.inventoryItem.inventoryLevels.edges[j].node;
          if (inventoryLevel.location.name === storeLocationName) {
            let quantity = inventoryLevel.quantities[0].quantity;
            isInStock = quantity > 2;
          }
        }
      }
      let inventoryStatusElement = document.querySelector(".inventory_status");
      let stockElement = document.querySelector(".inventory_status .stock");
      if (isInStock) {
        inventoryStatusElement.classList.add("in-stock");
        inventoryStatusElement.classList.remove("out-stock");
        stockElement.textContent = "In-stock";
      } else {
        inventoryStatusElement.classList.add("out-stock");
        inventoryStatusElement.classList.remove("in-stock");
        stockElement.textContent = "Out of Stock";
      }
      document.querySelector(".inventory-details .broadway .dropdown b").textContent = storeLocationName;
    }
  }
  for (let i = 0; i < data.product.collections.nodes.length; i++) {
    if (data.product.collections.nodes[i].handle === "automated-collection") {
      console.log("Collection:", data.product.collections.nodes[i], "Collections working");
    }
  }
  for (let i = 0; i < data.product.tags.length; i++) {
    if (data.product.tags[i] === "Accessory") {  console.log("Tag:", data.product.tags[i], "Tag validation is working");  }
  }
}
async function refreshInventoryLocations() {
  try {
    let accessToken = await fetchAccessToken(); console.log('refreshInventoryLocations accessToken   ',accessToken.accessToken);  
    getInventoryLocations(accessToken, (error, data) => {
      if (data) {  handleInventoryLocationsResponse(data); } else { console.error("Error:", error); }
    });
  } catch (error) { console.error("Error refreshing inventory locations:", error); }
}
document.addEventListener("click", event => {
  if (!event.target.closest(".inventory-details")) { refreshInventoryLocations(); }
});
const crossElement = document.querySelector(".popup-close-cross");
function showModal(){let storeLocationName=getCookie("storelocationName");fetchAccessToken().then(({accessToken})=>{getLocations(accessToken,storeLocationName)}).catch(console.error);refreshInventoryLocations()}
if (crossElement) {
  crossElement.addEventListener("click", event => {     event.preventDefault();
    let popupModal = document.querySelector(".popup-modal");
    if (popupModal) { popupModal.style.display = "none"; popupModal.classList.remove("showmodal"); }
  });
} else {
  console.log("Element with class 'cross' not found");
}
document.addEventListener("change", event => {  if (event.target.matches(".popup-modal .address-popup input.locations")) {    let locationName = event.target.nextElementSibling.textContent;
    setCookie("storelocationName", locationName);    setCookie("storelocation", event.target.id);    refreshInventoryLocations();
  }
});
document.addEventListener("click", event => {  if (event.target.classList.contains("open-modal-cnc")) {showModal(); }});
refreshInventoryLocations();