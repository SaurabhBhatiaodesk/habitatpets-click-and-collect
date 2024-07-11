async function cartUpdate(updates) {
    try {let response = await fetch("/cart/update.js", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updates: updates })});
      if (response.ok) { console.log("testings ", response); let errorMessages = document.querySelectorAll(".cart-grid p.error-massage.active");
        for (let i = 0; i < errorMessages.length; i++) { let errorMessage = errorMessages[i]; errorMessage.closest(".cart-grid").remove(); }
        document.querySelector(".remove-allitem").style.display = "none"; let checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
        checkoutButton.disabled = false; checkoutButton.classList.remove("disabled"); let cartResponse = await fetch("/cart.json"); let cartData = await cartResponse.json();
        let totalPrice = parseFloat((cartData.original_total_price / 100).toFixed(2)).toLocaleString("en-UA", { style: "currency",currency: cartData.currency});
        document.querySelector(".cart-right .sub-total .price .totals__subtotal-value").innerHTML = totalPrice;
      }
    } catch (error) { console.error("Error:", error);}
  }
  async function fetchAccessToken(){try{let response=await fetch(`https://clickncollect-12d7088d53ee.herokuapp.com/api/get?shop=${location.hostname}`,{headers:{"Content-Type":"application/json",Accept:"application/json"}});if(!response.ok)throw new Error("Network response was not ok.");return await response.json()}catch(error){console.error("Error fetching access token:",error);throw error;}}
  async function getCartLocations(accessToken, selectedLocationName = "") {
    try {
      let response = await fetch("/admin/api/2024-04/locations.json", {headers: { "X-Shopify-Access-Token": accessToken }});
      if (response.ok) { let data = await response.json(); let locations = [];
        for (let i = 0; i < data.locations.length; i++) {
          let location = data.locations[i]; if (location.zip) { locations.push(`${location.address1} ${location.city} ${location.zip} ${location.province} ${location.country_name}`); }
        }
        let locationsElement = document.querySelector(".address-popup11 .locationss"); locationsElement.innerHTML = "";
        if (locations.length > 0) {
          let customerLocation = getCookie("customerlocation"); document.querySelector(".location").value = customerLocation;
          let distanceApiUrl = `https://clickncollect-12d7088d53ee.herokuapp.com/api/distance?customerlocation=${customerLocation}&destinations=${locations.join("|")}&shop=${document.domain}`;
          let distanceData = await fetchData(distanceApiUrl); let locationData = [];
          for (let i = 0; i < data.locations.length; i++) {
            let location = data.locations[i];
            if (distanceData.rows[0].elements[i].status == "OK") {
              let distanceText = distanceData.rows[0].elements[i].distance.text;
              locationData.push({
                ...location,
                distance: parseInt(distanceText.replace(/,/g, "").replace(" km", "")),
                distancetext: distanceText
              });
            }    
          }
          locationData.sort((a, b) => a.distance - b.distance);
          for (let i = 0; i < locationData.length; i++) { let location = locationData[i];
            if (selectedLocationName && location.name !== "Snow City Warehouse") { let radioBtn = document.createElement("div"); radioBtn.classList.add("radio-btn"); let colDiv = document.createElement("div"); colDiv.classList.add("col");
                let radioInput = document.createElement("input"); radioInput.type = "radio"; radioInput.id = location.id; radioInput.classList.add("locations"); radioInput.name = "locations"; radioInput.dataset.name = location.name; if (selectedLocationName === location.name) { radioInput.checked = true; }
                let label = document.createElement("label"); label.htmlFor = location.id; label.textContent = location.name;
                colDiv.appendChild(radioInput); colDiv.appendChild(label); let col2Div = document.createElement("div"); col2Div.classList.add("col2"); col2Div.textContent = location.distancetext;
                radioBtn.appendChild(colDiv); radioBtn.appendChild(col2Div); locationsElement.appendChild(radioBtn);
            }
        }
        } else {let noStoresElement = document.createElement("div"); noStoresElement.classList.add("popup-inner-col11"); noStoresElement.innerHTML = '<div class="add11">Stores not available for entered location</div>'; locationsElement.appendChild(noStoresElement);}
        document.querySelector(".address-popup11").style.display = "block";
      }} catch (error) { console.error("Error getting cart locations:", error);}
  }
  async function get_inv_locations(accessToken, product) {console.log('get_inv_locations accessToken ',accessToken);
    let query = `query MyQuery { product(id: "gid://shopify/Product/${product.product_id}") { tags title tracksInventory collections(first: 10) { nodes { id title handle } } variants(first: 10) { nodes { inventoryItem { inventoryLevels(first: 10) { edges { node { location { activatable name } id quantities(names: "available") { name id quantity } } } } } id } } } }`;
    try {
        let response=await fetch(`${location.origin}/admin/api/2024-04/graphql.json`,{method:"POST",headers:{"Content-Type":"application/json","X-Shopify-Access-Token":`${accessToken}`},body:JSON.stringify({query:query})});
      if (response.ok) {let data = await response.json(); handle_inv_locations(null, data.data, product);
      } else { let error = new Error("Request failed"); handle_inv_locations(error, null, product); }
    } catch (error) { handle_inv_locations(error, null, product); }
  }
  function handle_inv_locations(error, data, product) {
    if (error) { console.error("Error fetching inventory locations:", error); return;}
    let variantId = product.variant_id;
    let storeLocationName = getCookie("storelocationName");
    for (let i = 0; i < data.product.variants.nodes.length; i++) {
      let variant = data.product.variants.nodes[i];
      let variantIdParts = variant.id.split("/");
      let currentVariantId = variantIdParts[variantIdParts.length - 1];
      if (currentVariantId == variantId) {
        let isInStock = false;
        if (variant.inventoryItem && variant.inventoryItem.inventoryLevels) {
          for (let j = 0; j < variant.inventoryItem.inventoryLevels.edges.length; j++) {
            let inventoryLevel = variant.inventoryItem.inventoryLevels.edges[j].node;
            let locationName = inventoryLevel.location.name;
            if (storeLocationName == locationName && locationName !== "Snow City Warehouse") {
              isInStock = inventoryLevel.quantities[0].quantity > 2 && inventoryLevel.quantities[0].quantity >= product.quantity;
            }
          }
        }
        let cartGrids = document.querySelectorAll(".cart-grid");
        for (let k = 0; k < cartGrids.length; k++) {
          let cartGrid = cartGrids[k];
          if (cartGrid.dataset.id == variantId) { let errorMessage = cartGrid.querySelector(".error-massage"); 
            if (isInStock) { errorMessage.style.display = "none"; errorMessage.classList.remove("active");
            } else { cartGrid.querySelector(".error-massage .locationsname").textContent = storeLocationName; errorMessage.style.display = "block"; errorMessage.classList.add("active");
            }
          }
        }
      }
    }
    let hasActiveErrors = document.querySelectorAll(".cart-grid p.error-massage.active").length > 0; let removeAllItemButton = document.querySelector(".remove-allitem");let checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn"); removeAllItemButton.style.display = hasActiveErrors ? "flex" : "none"; checkoutButton.disabled = hasActiveErrors; checkoutButton.classList.toggle("disabled", hasActiveErrors);
  } 
  async function fetch_inventory_for_cart_items(accessToken, cartItems) { console.log('fetch_inventory_for_cart_items accessToken  ',accessToken);
    let cartGrids = document.querySelectorAll(".cart-grid");
    for (let i = 0; i < cartGrids.length; i++) {
      let cartGrid = cartGrids[i]; let cartGridId = cartGrid.dataset.id; let cartItem = cartItems.find(item => item.variant_id == cartGridId);
      if (cartItem) { let quantityElement = cartGrid.querySelector(".item-quantities span b");
        if (quantityElement) { quantityElement.textContent = cartItem.quantity;}
        cartGrid.classList.add("matched"); get_inv_locations(accessToken.accessToken, cartItem);
      } else { cartGrid.style.display = "none"; }
    }
    let unmatchedCartGrids = document.querySelectorAll(".cart-grid:not(.matched)");
    for (let i = 0; i < unmatchedCartGrids.length; i++) { let unmatchedCartGrid = unmatchedCartGrids[i]; unmatchedCartGrid.style.display = "none"; }
  }
  async function init() {
    let accessToken = await fetchAccessToken(); let cartResponse = await fetch("/cart.js");
    if (cartResponse.ok) { let cartData = await cartResponse.json(); fetch_inventory_for_cart_items(accessToken, cartData.items); }
  }
  init();  
  function handleInventoryLocations(error, productData, cartData) {
    if (error) { console.error("Error fetching inventory locations:", error); return; }
    let variantId = cartData.variant_id;
    let storeLocationName = getCookie("storelocationName");
    let cartGridElements = document.querySelectorAll(".cart-grid");
    for (var i = 0; i < productData.product.variants.nodes.length; i++) {
        var variant = productData.product.variants.nodes[i];
        let variantIds = variant.id.split("/");
        let id = variantIds[variantIds.length - 1];
        if (id == variantId) { let isAvailable = false;
            if (variant.inventoryItem && variant.inventoryItem.inventoryLevels) {
                for (var j = 0; j < variant.inventoryItem.inventoryLevels.edges.length; j++) {
                    var inventoryLevel = variant.inventoryItem.inventoryLevels.edges[j].node; let locationName = inventoryLevel.location.name;
                    if (storeLocationName == locationName && locationName != "Snow City Warehouse") {
                        isAvailable = (inventoryLevel.quantities[0].quantity > 2) && (inventoryLevel.quantities[0].quantity >= cartData.quantity);
                    } else if (!locationName || locationName == "undefined") { isAvailable = true; }
                }
            }
            for (var k = 0; k < cartGridElements.length; k++) { var cartGrid = cartGridElements[k];
                if (cartGrid.dataset.id == variantId) { var errorMessage = cartGrid.querySelector(".error-massage");
                    if (isAvailable) { errorMessage.style.display = "none"; errorMessage.classList.remove("active");
                    } else {
                        var locationNameElement = cartGrid.querySelector(".error-massage .locationsname"); locationNameElement.textContent = storeLocationName; errorMessage.style.display = "block";
                        errorMessage.classList.add("active"); }
                }
            }
        }
    }
    var activeErrorMessages = document.querySelectorAll(".cart-grid p.error-massage.active");
    if (activeErrorMessages.length > 0) { document.querySelector(".remove-allitem").style.display = "flex"; var checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn"); checkoutButton.disabled = true; checkoutButton.classList.add("disabled");
    } else {document.querySelector(".remove-allitem").style.display = "none"; var checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");checkoutButton.disabled = false; checkoutButton.classList.remove("disabled");
    }
}
function fetchInventoryForCartItems(accessToken, cartItems) {
    var cartGridElements = document.querySelectorAll(".cart-grid");
    for (var i = 0; i < cartGridElements.length; i++) { var cartGrid = cartGridElements[i]; var variantId = cartGrid.dataset.id; var matched = false;
        for (var j = 0; j < cartItems.length; j++) { var cartItem = cartItems[j];
            if (cartItem.variant_id == variantId) { matched = true; var itemQuantities = cartGrid.querySelector(".item-quantities span b");
                if (itemQuantities) { itemQuantities.textContent = cartItem.quantity; }
            }
        }
        if (matched) { cartGrid.classList.add("matched"); cartGrid.classList.remove("unmatched"); }
        else { cartGrid.classList.remove("matched");  cartGrid.classList.add("unmatched"); }
    }
    for (var i = 0; i < cartGridElements.length; i++) { var cartGrid = cartGridElements[i]; if (cartGrid.classList.contains("unmatched")) { cartGrid.remove(); } }
    for (var i = 0; i < cartItems.length; i++) { getInventoryLocations(accessToken, cartItems[i]); }
}
fetch("/cart.json")
    .then(function(response) { return response.json();
    }).then(function(data) {var cartItems = data.items;
        fetchAccessToken().then(function(response) {
                fetchInventoryForCartItems(response.accessToken, cartItems);
                var currency = response.currency;
                var totalPrice = parseFloat((response.original_total_price / 100).toFixed(2)).toLocaleString("en-US", { style: "currency", currency: currency });
                document.querySelector(".cart-right .sub-total .price .totals__subtotal-value").innerHTML = totalPrice;
            }).catch(function(error) { console.error("Error fetching access token:", error); });
    }).catch(function(error) { console.error("Error fetching cart items:", error); });
    document.addEventListener("change", function(event) {
    if (event.target.matches(".radio-cart.locationss input.locations")) {
        var variantIds = [];
        setCookie("storelocation", event.target.id);
        document.querySelectorAll(".cart-right .cart-border .cart-grid").forEach(function(cartGrid) {
            variantIds.push(cartGrid.dataset.id);
        });
        setCookie("storelocationName", event.target.nextElementSibling.textContent);
        fetch("/cart.json").then(function(response) {return response.json(); }).then(function(data) {
                var cartItems = data.items;
                    fetchAccessToken().then(function(response) {
                        fetchInventoryForCartItems(response.accessToken, cartItems);
                        var activeErrorMessages = document.querySelectorAll(".cart-grid p.error-massage.active");
                        if (activeErrorMessages.length > 0) { document.querySelector(".remove-allitem").style.display = "flex"; var checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn"); checkoutButton.disabled = true; checkoutButton.classList.add("disabled");} 
                        else { document.querySelector(".remove-allitem").style.display = "none"; var checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn"); checkoutButton.disabled = false; checkoutButton.classList.remove("disabled"); }
                        var currency = response.currency; var totalPrice = parseFloat((response.original_total_price / 100).toFixed(2)).toLocaleString("en-US", { style: "currency", currency: currency });
                        document.querySelector(".cart-right .sub-total .price .totals__subtotal-value").innerHTML = totalPrice;
                    }).catch(function(error) {console.error("Error fetching access token:", error); });
            }).catch(function(error) {console.error("Error fetching cart items:", error);});
    }
});