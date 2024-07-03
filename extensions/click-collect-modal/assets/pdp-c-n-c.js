async function fetchAccessToken() {
  try {
      let response = await fetch(`https://events-announcements-playback-shape.trycloudflare.com/api/get?shop=${location.hostname}`, {
          headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
          }
      });
      if (!response.ok) throw Error("Network response was not ok.");
      console.log(await response.text(),"accessToken: ");
      return await response.json();
  } catch (error) {
      throw console.error("Error fetching access token:", error), error;
  }
}


async function fetchData(url) {
  try {
      let response = await fetch(url);
      if (!response.ok) throw Error(`Failed to fetch data from ${url}`);
      return await response.json();
  } catch (error) {
      throw console.error("Error fetching data:", error), error;
  }
}

async function getLocations(accessToken, selectedLocation = "") {
  try {
      let response = await fetch("/admin/api/2024-04/locations.json", {
          headers: {
              "X-Shopify-Access-Token": accessToken
          }
      });
      if (!response.ok) throw Error(`Request failed with status ${response.status}`);
      let data = await response.json(),
          addressList = data.locations.filter(location => location.zip).map(location => `${location.address1} ${location.city} ${location.zip} ${location.province} ${location.country_name}`),
          locationsContainer = document.querySelector(".popup-box .address-popup .locationss");
      if (locationsContainer.innerHTML = "", addressList.length > 0) {
          let customerLocation = getCookie("customerlocation");
          document.querySelector(".location").value = customerLocation;
          let distanceUrl = `https://events-announcements-playback-shape.trycloudflare.com/api/distance?customerlocation=${customerLocation}&destinations=${addressList.join("|")}&shop=${location.host}`,
              distanceData = await fetchData(distanceUrl),
              sortedLocations = data.locations.map((location, index) => {
                  if ("OK" === distanceData.rows[0].elements[index].status) {
                      let distanceText = distanceData.rows[0].elements[index].distance.text,
                          distance = parseInt(distanceText.replace(/,/g, "").replace(" km", ""));
                      return {
                          ...location,
                          distance,
                          distanceText,
                          origin: distanceData.origin_addresses
                      };
                  }
              }).filter(Boolean).sort((a, b) => a.distance - b.distance);
          sortedLocations.forEach(location => {
              if ("Snow City Warehouse" !== location.name) {
                  let locationElement = document.createElement("div");
                  locationElement.classList.add("popup-inner-col");
                  locationElement.innerHTML = `
                      <div class="add">
                          <span>
                              <input type="radio" id="${location.id}" class="locations" data-name="${location.name}" name="locations" value="HTML" ${selectedLocation === location.name ? 'checked="checked"' : ""}>
                              <label for="${location.id}">${location.name}</label>
                          </span>
                          <h4>${location.distanceText}</h4>
                      </div>
                      <ul class="order-list">
                          <li>${location.country_name}</li>
                          <li>Address: ${location.address1}</li>
                          <li>Phone: ${location.phone}</li>
                      </ul>
                      <button type="submit">
                          <a href="https://www.google.com/maps/dir/${location.origin}/${location.address1} ${location.city} ${location.zip} ${location.province} ${location.country_name}" target="_blank">Get Directions >></a>
                      </button>`;
                  locationsContainer.appendChild(locationElement);
              }
          });
      } else {
          let noStoresElement = document.createElement("div");
          noStoresElement.classList.add("popup-inner-col");
          noStoresElement.innerHTML = '<div class="add">Stores not available for entered location</div>';
          locationsContainer.appendChild(noStoresElement);
      }
      document.querySelector(".popup-box .address-popup").style.display = "block";
      document.querySelector("body .popup-modal").classList.add("showmodal");
  } catch (error) {
      console.error("Error fetching locations:", error);
  }
}

async function getInventoryLocations(accessToken, callback) {

  console.log('accessToken --------- tttttt',accessToken)
  let productId = document.querySelector('.product-form input[name="product-id"]').value,
      query = `query {product(id: "gid://shopify/Product/${productId}") {tags title tracksInventory collections(first: 10) {nodes { id title handle }}variants(first: 10) { nodes {inventoryItem {inventoryLevels(first: 10) { edges { node { location { activatable name } id quantities(names: "available") { name id quantity }}}}id}}}}}`;
  try {
      let response = await fetch(`${location.origin}/admin/api/2024-04/graphql.json`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": accessToken
          },
          body: JSON.stringify({
              query,
              variables: {}
          })
      });
      console.log('response:', response, ' callback:', callback);
      if (!response.ok) throw Error(`Request failed with status ${response.status}`);
      let data = await response.json();
      callback(null, data.data);
  } catch (error) {
      console.error("Error fetching inventory locations:", error), callback(error, null);
  }
}

function handleInventoryLocationsResponse(data) {
  let storeLocationName = getCookie("storelocationName"),
      selectedVariantId = document.querySelector(".product-form .product-variant-id").value;
  data.product.variants.nodes.forEach(variant => {
      console.log('variant:', variant.id);
      let variantIdParts = variant.id.split("/"),
          variantId = variantIdParts[variantIdParts.length - 1];
      if (variantId === selectedVariantId) {
          let inStock = false;
          if (variant.inventoryItem && variant.inventoryItem.inventoryLevels) {
              variant.inventoryItem.inventoryLevels.edges.forEach(inventoryLevel => {
                  let location = inventoryLevel.node.location;
                  if (location.name === storeLocationName) {
                      let quantity = inventoryLevel.node.quantities[0].quantity;
                      inStock = quantity > 2;
                  }
              });
          }
          let inventoryStatusElement = document.querySelector(".inventory_status"),
              stockStatusElement = document.querySelector(".inventory_status .stock");
          if (inStock) {
              inventoryStatusElement.classList.add("in-stock");
              inventoryStatusElement.classList.remove("out-stock");
              stockStatusElement.textContent = "In-stock";
          } else {
              inventoryStatusElement.classList.add("out-stock");
              inventoryStatusElement.classList.remove("in-stock");
              stockStatusElement.textContent = "Out of Stock";
          }
          document.querySelector(".inventory-details .broadway .dropdown b").textContent = storeLocationName;
      }
  });
  data.product.collections.nodes.forEach(collection => {
      if (collection.handle === "automated-collection") {
          console.log("collection:", collection, "collections working");
      }
  });
  data.product.tags.forEach(tag => {
      if (tag === "Accessory") {
          console.log("tag:", tag, "tag validation is working");
      }
  });
}

async function refreshInventoryLocations() {
  try {
      let accessToken = await fetchAccessToken();
      console.log('accessToken  --- :', accessToken);
      getInventoryLocations(accessToken, (error, data) => {
          if (data) {
              handleInventoryLocationsResponse(data);
          } else {
              console.error("Error:", error);
          }
      });
  } catch (error) {
      console.error("Error refreshing inventory locations:", error);
  }
}

document.addEventListener("click", event => {
  if (!event.target.closest(".inventory-details")) {
      refreshInventoryLocations();
  }
});

const crossElement = document.querySelector(".popup-close-cross");

function showModal() {
  let storeLocationName = getCookie("storelocationName");
  fetchAccessToken().then(({ accessToken }) => {
      getLocations(accessToken, storeLocationName);
  }).catch(console.error);
  refreshInventoryLocations();
}

if (crossElement) {
  crossElement.addEventListener("click", event => {
      event.preventDefault();
      let modal = document.querySelector(".popup-modal");
      if (modal) {
          modal.style.display = "none";
          modal.classList.remove("showmodal");
      }
  });
} else {
  console.log("Element with class 'cross' not found");
}

document.addEventListener("change", event => {
  if (event.target.matches(".popup-modal .address-popup input.locations")) {
      let storeLocationName = event.target.nextElementSibling.textContent;
      setCookie("storelocationName", storeLocationName);
      setCookie("storelocation", event.target.id);
      refreshInventoryLocations();
  }
});

document.addEventListener("click", event => {
  if (event.target.classList.contains("open-modal-cnc")) {
      showModal();
  }
});

refreshInventoryLocations();
