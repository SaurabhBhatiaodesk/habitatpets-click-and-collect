async function cartUpdate(updates, flag = false) {
	try {
		let response = await fetch("/cart/update.js", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				updates: updates
			})
		});
		if (response.ok) {

			if (flag == true) {
				let errorMessages = document.querySelectorAll(".cart-grid p.error-massage.active");
				for (let i = 0; i < errorMessages.length; i++) {
					let errorMessage = errorMessages[i];
					errorMessage.closest(".cart-grid").remove();
				}
				document.querySelector(".remove-allitem").style.display = "none";
			}
			let checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
			checkoutButton.disabled = false;
			checkoutButton.classList.remove("disabled");
			let cartResponse = await fetch("/cart.json");
			let cartData = await cartResponse.json();
			let totalPrice = parseFloat((cartData.original_total_price / 100).toFixed(2)).toLocaleString("en-UA", {
				style: "currency",
				currency: cartData.currency
			});

			document.querySelector(".cart-right .sub-total .price .totals__subtotal-value").innerHTML = totalPrice;
			localStorage.setItem("testings", JSON.stringify([]));
		}
	} catch (error) {
		console.error("Error:", error);
	}
}
async function fetchAccessToken() {
	try {
		let response = await fetch(`https://clickncollect-12d7088d53ee.herokuapp.com/api/get?shop=${location.hostname}`, {
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json"
			}
		});
		if (!response.ok) throw new Error("Network response was not ok.");
		return await response.json()
	} catch (error) {
		console.error("Error fetching access token:", error);
		throw error;
	}
}
async function fetchQuantity() {
	try {
		let response = await fetch(`https://clickncollect-12d7088d53ee.herokuapp.com/api/quantity?shop=${location.hostname}`, {
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json"
			}
		});
		if (!response.ok) throw new Error("Network response was not ok.");
		return await response.json()
	} catch (error) {
		console.error("Error fetching access token:", error);
		throw error;
	}
}
async function fetchLocationsGraphQL(accessToken) {
	const myHeaders = new Headers(); myHeaders.append("Content-Type", "application/json"); myHeaders.append("X-Shopify-Access-Token", accessToken);
	const graphql = JSON.stringify({ query: `query MyQuery {locations(first: 10) {nodes {activatable hasActiveInventory isActive localPickupSettingsV2 { instructions pickupTime } name id address {zip provinceCode province phone longitude latitude formatted countryCode country city address2 address1 } } } }`, variables: {} });
	const requestOptions = { method: "POST", headers: myHeaders, body: graphql, redirect: "follow" };
	try { const response = await fetch("/admin/api/2024-04/graphql.json", requestOptions); if (!response.ok) throw new Error(`Request failed with status ${response.status}`); return await response.json(); } catch (error) { console.error("Error fetching locations:", error); throw error; }
}
async function getCartLocations(accessToken, selectedLocationName = "") {
	try {
		var count = 0;
		const testres = await fetchLocationsGraphQL(accessToken);
		let arrr = localStorage.getItem("testings");
		arrr = JSON.parse(arrr);
		// console.log('testingskkkkkkkkkkkkkkeeeeeeeees',arrr);
		// console.log('testres ', testres)
		if (testres.data.locations.nodes.length > 0) {
			const locations = testres?.data?.locations?.nodes;
			const destinationsArr = []; if (locations) {
				for (const location of locations) {
					if (location.address.zip && location?.localPickupSettingsV2 != null) {
						destinationsArr.push(`${location.address.address1} ${location.address.city} ${location.address.zip} ${location.address.province} ${location.address.country}`);
					}
				}
			}
			let locationsElement = document.querySelector(".address-popup11 .locationss");
			locationsElement.innerHTML = "";
			if (destinationsArr.length > 0) {
				let customerLocation = getCookie("customerlocation");
				document.querySelector(".location").value = customerLocation;
				let distanceApiUrl = `https://clickncollect-12d7088d53ee.herokuapp.com/api/distance?customerlocation=${customerLocation}&destinations=${destinationsArr.join("|")}&shop=${location.hostname}`;
				let res = await fetchData(distanceApiUrl);		
				let locationData = [];	const sortedLocations = []; 
				for (const location of locations) {
					if (location.address.zip && location?.localPickupSettingsV2 != null) {
						const zipcode = location.address.zip; const fulladdress = location.address.address1 + ' ' + zipcode;
						for (let index = 0; index < destinationsArr.length; index++) {
							const distanceElement = res?.rows[0]?.elements[index]; const destinationAddress = destinationsArr[index];
							// console.log(fulladdress, ' location.address ', ' destinationsArr ', destinationAddress, ' location.name ', location.name, 'distanceElement ', distanceElement)
							if (destinationAddress.includes(zipcode)) {
								if (distanceElement?.status == "OK" && distanceElement?.status != "ZERO_RESULTS"  && distanceElement?.distance?.value < 50000) {
									const distanceText = distanceElement?.distance.text;
									const parsedDistance = parseInt(distanceText.replace(/,/g, "").replace(" km", ""));
									// console.log('distanceElement ',index,' distanceText ',distanceText, ' parsedDistance ',parsedDistance);   
									sortedLocations.push({
										id: location.id,
										distance: parsedDistance,
										distanceText,
										origin: res.origin_addresses,
										...location
									});
									locationData.push(location.name);
								}else if (distanceElement?.status == "OK" && distanceElement?.status != "ZERO_RESULTS"  && distanceElement?.distance?.value > 1){
									count = count +1;
								}
							}
						}
					}
				}
				sortedLocations.sort((a, b) => a.distance - b.distance);
				// console.log('sortedLocations ', locationData)
				let locationsss = locationData.join(', ');
				// console.log('locations ', locationsss)
				setCookie('sortedLocations', locationsss);
			
				for (let i = 0; i < sortedLocations.length; i++) {
					let location = sortedLocations[i];
					let loc= location?.name;
					// console.log('location ', location, 'selectedLocationName',arrr,'  arrr.location ', arrr?.[loc],'loc -- ', loc, selectedLocationName, location.distanceText)
					// if (selectedLocationName && location.name != "Snow City Warehouse") {
					let radioBtn = document.createElement("div");  
					if(arrr?.[loc] ){ radioBtn.classList.add("radio-btn");
						radioBtn.classList.add("green");
					}else{	radioBtn.classList.add("radio-btn");   }         

					let colDiv = document.createElement("div");    
					colDiv.classList.add("col");   
					let radioInput = document.createElement("input");
					radioInput.type = "radio";
					radioInput.id = location.id;
					radioInput.classList.add("locations");
					radioInput.name = "locations";
					radioInput.dataset.name = location.name;
					if (selectedLocationName == location.name) {
						radioInput.checked = true;
					}
					let label = document.createElement("label");
					label.htmlFor = location.id;
					label.textContent = location.name;
					colDiv.appendChild(radioInput);
					colDiv.appendChild(label);
					let col2Div = document.createElement("div");
					col2Div.classList.add("col2");
					col2Div.textContent = location.distanceText;
					radioBtn.appendChild(colDiv);
					radioBtn.appendChild(col2Div);
					locationsElement.appendChild(radioBtn);
					// }
				}
			} else if (count > 0 && sortedLocations.length == 0){
				let noStoresElement = document.createElement("div");
				noStoresElement.classList.add("popup-inner-col11");
				noStoresElement.innerHTML = '<div class="add11">Stores are not available within a 50 km range</div>';
				locationsElement.appendChild(noStoresElement);
			}else {
				let noStoresElement = document.createElement("div");
				noStoresElement.classList.add("popup-inner-col11");
				noStoresElement.innerHTML = '<div class="add11">Stores not available for entered location</div>';
				locationsElement.appendChild(noStoresElement);
			}

			// 	document.querySelectorAll('.cart-popup .radio-btn .locations').forEach((element) => {
			// 	let isInStock = false;
			// 	  console.log('element ',element);
			// 		Object.keys(arrr).forEach((key,value) => {
			// 			console.log(element.getAttribute('data-name'),' -- key -- ', key, value);
			// 			if (element.getAttribute('data-name') == key && arrr[key] == true) {
			// 			isInStock = true;
			// 			if (isInStock) {
			// 				element.parentElement.style.color = 'green';
			// 				element.closest('.radio-btn').classList.remove('out-stock');
			// 				element.closest('.radio-btn').classList.add('in-stock');
			// 			  } else {
			// 				element.closest('.radio-btn').classList.remove('in-stock');
			// 				element.closest('.radio-btn').classList.add('out-stock');
			// 				element.parentElement.style.color = '';
			// 			  }
			// 			}
			// 		});       
			//   });     


			document.querySelector(".address-popup11").style.display = "block";
		}
	} catch (error) {
		console.error("Error getting cart locations:", error);
	}
}
async function get_inv_locations(accessToken, product, quantityres = 0) {
	// let query=`query MyQuery { product(id: "gid://shopify/Product/${product.product_id}") {tags title tracksInventory collections(first: 10) { nodes { id title handle } } variants(first: 10) { nodes { inventoryItem { inventoryLevels(first: 10) { edges { node { location { activatable name } id quantities(names: "available") { name id quantity } } } } } id } id } } }`;
	let query = `query MyQuery { product(id: "gid://shopify/Product/${product.product_id}") { tags title tracksInventory collections(first: 10) { nodes { id title handle } } variants(first: 10) { nodes { inventoryItem { inventoryLevels(first: 10) { edges { node { location { activatable name } id quantities(names: "available") { name id quantity } } } } } id } } } }`;
	try {
		let response = await fetch(`${location.origin}/admin/api/2024-04/graphql.json`, {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": `${accessToken}` },
			body: JSON.stringify({ query: query })
		});
		if (response.ok) {
			let data = await response.json();
			handle_inv_locations(null, data.data, product, quantityres);
		} else {
			let error = new Error("Request failed");
			handle_inv_locations(error, null, product, quantityres);
		}
	} catch (error) {
		handle_inv_locations(error, null, product, quantityres);
	}
}
function filterlocations(data, product, quantity) {
	// console.log('filterlocations product', data, product);
	let variantId = product.variant_id;
	let getSortedLocations = getCookie('sortedLocations');
	let sortedLocations = [];
	let sorted = {};

	if (getSortedLocations) {
		sortedLocations = getSortedLocations.split(', ');
		// console.log('handle_inv_locations Sorted Locations:', sortedLocations);
	}

	// Loop through sorted locations and initialize them as true in the sorted object
	for (let i = 0; i < sortedLocations.length; i++) {
		const storeLocationName = sortedLocations[i];
		if (typeof(storeLocationName) === "string") {
			sorted[storeLocationName] = false;
		  } // console.log(sorted , '--  storeLocationName --', storeLocationName);
	}
	// console.log('data.product.variants.nodes ', data.product.variants.nodes, data)
	var isInStock = true;
	for (let j = 0; j < data.product.variants.nodes.length; j++) {
		let variant = data.product.variants.nodes[j];
		let variantIdParts = variant.id.split("/");
		let currentVariantId = variantIdParts[variantIdParts.length - 1];
		// console.log('currentVariantId ',currentVariantId, ' --- ',variantId)      
		if (currentVariantId == variantId) {
			isInStock = false;
			if (variant.inventoryItem && variant.inventoryItem.inventoryLevels) {
				for (let k = 0; k < variant.inventoryItem.inventoryLevels.edges.length; k++) {
					let inventoryLevel = variant.inventoryItem.inventoryLevels.edges[k].node;
					let locationName = inventoryLevel.location.name;
					let storeLocationName = sortedLocations.find(name => name === locationName);
					// console.log('storeLocationName ',storeLocationName)
					if (storeLocationName) {
						// console.log('inventoryLevel.quantities[0].quantity ',inventoryLevel.quantities[0].quantity, ' > api quantity ',quantity, ' and  >= product.quantity ',product.quantity )
						if(inventoryLevel.quantities[0].quantity > quantity && inventoryLevel.quantities[0].quantity >= product.quantity){
							isInStock = true;
							sorted[storeLocationName] = isInStock;
						}
						// console.log('isInStock ',isInStock, 'storeLocationName ',storeLocationName, '  --   ',sorted[storeLocationName], '  sorted ',sorted);
						// break;
					}
				}
			}
		}
	}

		let arrr = JSON.parse(localStorage.getItem("testings") || "[]");
		if(!arrr){
			localStorage.setItem("testings", JSON.stringify(sorted));
		}else{
			// console.log('else arrr has ',arrr)    
			for (let i = 0; i < sortedLocations.length; i++) {
				const storeLocationName = sortedLocations[i];
				// console.log('key ', storeLocationName,'--- arr.key', arrr[storeLocationName], ' ---- ',arrr.storeLocationName )
				// if (arrr[storeLocationName]) {
				// 	if (isInStock == false) {
				// 		sorted[storeLocationName] = false; 
				// 	}
				// } else {
					if (sorted[storeLocationName] == true && arrr[storeLocationName] == false) {
						sorted[storeLocationName] = false; 
					}
				// }
			}

		}     
		// console.log('arrr has ',arrr, '-- sorted --',sorted)    
	return sorted;
}


async function handle_inv_locations(error, data, product, quantityres) {

	if (error) { console.error("Error fetching inventory locations:", error); return; }

	// if(document.querySelectorAll('.cart-popup .radio-btn .locations').length > 1){	
	let arrr = filterlocations(data, product, quantityres.quantity);
	// }
	document.querySelectorAll('.cart-popup .radio-btn .locations').forEach((element) => {
		let isInStock = false;
	  	// console.log('element ',element, ' data -- ', data, ' -- product -- ', product, ' quantity ', quantityres.quantity);
		Object.keys(arrr).forEach((key) => {
			if (element.getAttribute('data-name') == key && arrr[key] == true) {
			// console.log(element.getAttribute('data-name'), '---- ---- ', key, ' ----- ',arrr[key] );
			isInStock = true;
		  }
		});

		if (isInStock) {
		  element.parentElement.style.color = 'green';
		  element.closest('.radio-btn').classList.remove('out-stock');
		  element.closest('.radio-btn').classList.add('in-stock');
		} else {
		  element.closest('.radio-btn').classList.remove('in-stock');
		  element.closest('.radio-btn').classList.add('out-stock');
		  element.parentElement.style.color = '';
		}
	  });     
	  	// console.log('arrr localStorage.setItem ',arrr);

	  localStorage.setItem("testings", JSON.stringify(arrr));
	
	let variantId = product.variant_id;
	let storeLocationName = getCookie("storelocationName");
	// let getSortedLocations = getCookie('sortedLocations');
	// let sortedLocations = [];
	// if (getSortedLocations) {
	// 	 sortedLocations = getSortedLocations.split(', ');        
	// 	console.log('handle_inv_locations Sorted Locations:', sortedLocations);
	// }    


	for (let i = 0; i < data.product.variants.nodes.length; i++) {
		let variant = data.product.variants.nodes[i];
		let variantIdParts = variant.id.split("/");
		let currentVariantId = variantIdParts[variantIdParts.length - 1];
		// console.log('currentVariantId ',currentVariantId, ' variantId ',variantId)
		if (currentVariantId == variantId) {
			let isInStock = false;
			if (variant.inventoryItem && variant.inventoryItem.inventoryLevels) {
				for (let j = 0; j < variant.inventoryItem.inventoryLevels.edges.length; j++) {
					let inventoryLevel = variant.inventoryItem.inventoryLevels.edges[j].node;
					let locationName = inventoryLevel.location.name;
					// console.log('locationName',locationName);
					if (storeLocationName === locationName) {
						isInStock = inventoryLevel.quantities[0].quantity > quantityres.quantity && inventoryLevel.quantities[0].quantity >= product.quantity;
						// if(inventoryLevel.quantities[0].quantity > 2 && inventoryLevel.quantities[0].quantity >= product.quantity){
						//     console.log(isInStock, ' -- flase isinstock', inventoryLevel.quantities[0].quantity, product.quantity)
						// }else{
						//     console.log(isInStock,' -- True isinstock', inventoryLevel.quantities[0].quantity, product.quantity)
						// }
					}
				}
			}
			let cartGrids = document.querySelectorAll(".cart-grid");
			for (let k = 0; k < cartGrids.length; k++) {
				let cartGrid = cartGrids[k];
				if (cartGrid.dataset.id == variantId) {
					let errorMessage = cartGrid.querySelector(".error-massage");
					if (isInStock) {
						// console.log('not active ',variantId)
						errorMessage.style.display = "none";
						errorMessage.classList.remove("active");
					} else {
						// console.log('Active ',variantId)
						cartGrid.querySelector(".error-massage .locationsname").textContent = storeLocationName;
						errorMessage.style.display = "block";
						errorMessage.classList.add("active");
					}
				}
			}
		}
	}
	let hasActiveErrors = document.querySelectorAll(".cart-grid p.error-massage.active").length > 0;
	let removeAllItemButton = document.querySelector(".remove-allitem");
	let checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
	removeAllItemButton.style.display = hasActiveErrors ? "flex" : "none";
	checkoutButton.disabled = hasActiveErrors;
	checkoutButton.classList.toggle("disabled", hasActiveErrors);
}
async function fetch_inventory_for_cart_items(accessToken, cartItems, quantityres) {
	// console.log('fetch_inventory_for_cart_items accessToken  ', accessToken, ' cartItems ',cartItems);     
	let cartGrids = document.querySelectorAll(".cart-grid");
	for (let i = 0; i < cartGrids.length; i++) {
		let cartGrid = cartGrids[i];
		let cartGridId = cartGrid.dataset.id;
		let cartItem = cartItems.find(item => item.variant_id == cartGridId);
		// console.log('cartItem ',cartItem)
		if (cartItem) {
			let quantityElement = cartGrid.querySelector(".item-quantities span b");
			if (quantityElement) {
				quantityElement.textContent = cartItem.quantity;
			}    
			cartGrid.classList.add("matched");
			get_inv_locations(accessToken.accessToken, cartItem, quantityres);
		} else {
			cartGrid.style.display = "none";
		}
	}
	let unmatchedCartGrids = document.querySelectorAll(".cart-grid:not(.matched)");
	for (let i = 0; i < unmatchedCartGrids.length; i++) {
		let unmatchedCartGrid = unmatchedCartGrids[i];
		unmatchedCartGrid.style.display = "none";
	}
}

async function init() {
	var quantityres = await fetchQuantity();
	let accessToken = await fetchAccessToken();
	let cartResponse = await fetch("/cart.js");
	if (cartResponse.ok) {
		let cartData = await cartResponse.json();
		fetch_inventory_for_cart_items(accessToken, cartData.items, quantityres);
	}
}
init();

function handleInventoryLocations(error, productData, cartData) {
	if (error) {
		console.error("Error fetching inventory locations:", error);
		return;
	}
	let variantId = cartData.variant_id;
	let storeLocationName = getCookie("storelocationName");
	let cartGridElements = document.querySelectorAll(".cart-grid");
	for (var i = 0; i < productData.product.variants.nodes.length; i++) {
		var variant = productData.product.variants.nodes[i];
		let variantIds = variant.id.split("/");
		let id = variantIds[variantIds.length - 1];
		if (id == variantId) {
			let isAvailable = false;
			if (variant.inventoryItem && variant.inventoryItem.inventoryLevels) {
				for (var j = 0; j < variant.inventoryItem.inventoryLevels.edges.length; j++) {
					var inventoryLevel = variant.inventoryItem.inventoryLevels.edges[j].node;
					let locationName = inventoryLevel.location.name;
					if (storeLocationName == locationName) {
						isAvailable = (inventoryLevel.quantities[0].quantity > 2) && (inventoryLevel.quantities[0].quantity >= cartData.quantity);
					} else if (!locationName || locationName == "undefined") {
						isAvailable = true;
					}
				}
			}
			for (var k = 0; k < cartGridElements.length; k++) {
				var cartGrid = cartGridElements[k];
				if (cartGrid.dataset.id == variantId) {
					var errorMessage = cartGrid.querySelector(".error-massage");
					if (isAvailable) {
						errorMessage.style.display = "none";
						errorMessage.classList.remove("active");
					} else {
						var locationNameElement = cartGrid.querySelector(".error-massage .locationsname");
						locationNameElement.textContent = storeLocationName;
						errorMessage.style.display = "block";
						errorMessage.classList.add("active");
					}
				}
			}
		}
	}
	var activeErrorMessages = document.querySelectorAll(".cart-grid p.error-massage.active");
	if (activeErrorMessages.length > 0) {
		document.querySelector(".remove-allitem").style.display = "flex";
		var checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
		checkoutButton.disabled = true;
		checkoutButton.classList.add("disabled");
	} else {
		document.querySelector(".remove-allitem").style.display = "none";
		var checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
		checkoutButton.disabled = false;
		checkoutButton.classList.remove("disabled");
	}
}
async function fetchInventoryForCartItems(accessToken, data) {
	var quantityres = await fetchQuantity();
	var cartItems = data.items;
	var currency = data.currency;
	// console.log('accessToken ',accessToken, ' cartItems ',cartItems);
	var cartGridElements = document.querySelectorAll(".cart-grid");
	for (var i = 0; i < cartGridElements.length; i++) {
		var cartGrid = cartGridElements[i];
		var variantId = cartGrid.dataset.id;
		var matched = false;

		for (var j = 0; j < cartItems.length; j++) {
			var cartItem = cartItems[j];
			// console.log(' fetchInventoryForCartItems cartItem.variant_id == variantId', cartItem.variant_id, variantId);
			if (cartItem.variant_id == variantId) {
				// console.log('cartItem.variant_id == variantId', cartItem.variant_id, variantId);
				matched = true;
				var itemQuantities = cartGrid.querySelector(".item-quantities span b");
				if (itemQuantities) {
					itemQuantities.textContent = cartItem.quantity;
				}
				let itemprice = parseFloat((cartItem.line_price / 100).toFixed(2)).toLocaleString("en-US", {
					style: "currency",
					currency: currency
				});
				cartGrid.querySelector("span.price.price--end").innerHTML = itemprice;
			}
		}
		var totalPrice = parseFloat((data.original_total_price / 100).toFixed(2)).toLocaleString("en-US", {
			style: "currency",
			currency: currency
		});
		document.querySelector(".cart-right .sub-total .price .totals__subtotal-value").innerHTML = totalPrice;
		if (matched) {
			cartGrid.classList.add("matched");
			cartGrid.classList.remove("unmatched");
		} else {
			cartGrid.classList.remove("matched");
			cartGrid.classList.add("unmatched");
		}
	}
	for (var i = 0; i < cartGridElements.length; i++) {
		var cartGrid = cartGridElements[i];
		if (cartGrid.classList.contains("unmatched")) {
			cartGrid.remove();
		}
	}
	for (var i = 0; i < cartItems.length; i++) {
		get_inv_locations(accessToken, cartItems[i],quantityres);
		// getInventoryLocations(accessToken, cartItems[i]);
	}
}
fetch("/cart.json")
	.then(function (response) {
		return response.json();
	}).then(function (data) {
		var cartItems = data.items;
		fetchAccessToken().then(function (response) {
			fetchInventoryForCartItems(response.accessToken, data);
			var currency = data.currency;
			var totalPrice = parseFloat((data.original_total_price / 100).toFixed(2)).toLocaleString("en-US", {
				style: "currency",
				currency: currency
			});
			document.querySelector(".cart-right .sub-total .price .totals__subtotal-value").innerHTML = totalPrice;
		}).catch(function (error) {
			console.error("Error fetching access token:", error);
		});
	}).catch(function (error) {
		console.error("Error fetching cart items:", error);
	});
document.addEventListener("change", function (event) {
	if (event.target.matches(".radio-cart.locationss input.locations")) {
		var variantIds = [];
		setCookie("storelocation", event.target.id);
		document.querySelectorAll(".cart-right .cart-border .cart-grid").forEach(function (cartGrid) {
			variantIds.push(cartGrid.dataset.id);
		});
		setCookie("storelocationName", event.target.nextElementSibling.textContent);
		fetch("/cart.json").then(function (response) {
			return response.json();
		}).then(function (data) {
			var cartItems = data.items;
			fetchAccessToken().then(function (response) {
				// console.log('responseresponseresponse ',response, ' data ',data);
				fetchInventoryForCartItems(response.accessToken, data);
				var activeErrorMessages = document.querySelectorAll(".cart-grid p.error-massage.active");
				if (activeErrorMessages.length > 0) {
					document.querySelector(".remove-allitem").style.display = "flex";
					var checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
					checkoutButton.disabled = true;
					checkoutButton.classList.add("disabled");
				} else {
					document.querySelector(".remove-allitem").style.display = "none";
					var checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
					checkoutButton.disabled = false;
					checkoutButton.classList.remove("disabled");
				}
				var currency = data.currency;
				var totalPrice = parseFloat((data.original_total_price / 100).toFixed(2)).toLocaleString("en-US", {
					style: "currency",
					currency: currency
				});
				document.querySelector(".cart-right .sub-total .price .totals__subtotal-value").innerHTML = totalPrice;
			}).catch(function (error) {
				console.error("Error fetching access token:", error);
			});
		}).catch(function (error) {
			console.error("Error fetching cart items:", error);
		});
	}
});
document.addEventListener("click", function (event) {
	if (event.target.matches("button.check-btn")) {
		localStorage.setItem("testings", JSON.stringify([]));
		setCookie("customerlocation", document.querySelector(".location").value);
		var storeLocationName = getCookie("storelocationName");
		fetchAccessToken().then(function (response) {
			getCartLocations(response.accessToken, storeLocationName);
		}).catch(function (error) {
			console.error("Error fetching access token:", error);
		});
	}
	if (event.target.matches("button.cart-btn.button")) {
		localStorage.setItem("testings", JSON.stringify([]));
		document.body.classList.add("bg-hidden");
		document.querySelector(".cart-popup").style.display = "block";
		var storeLocationName = getCookie("storelocationName");
		var customerLocation = getCookie("customerlocation");
		document.querySelector(".location").value = customerLocation;
		document.querySelector(".locationsname").textContent = storeLocationName;
		fetch("/cart.json")
			.then(function (response) {
				return response.json();
			})
			.then(function (data) {
				var cartItems = data.items;
				fetchAccessToken().then(function (response) {
					setCookie("accessToken", response.accessToken);
					getCartLocations(response.accessToken, storeLocationName);
					fetchInventoryForCartItems(response.accessToken, data);
				}).catch(function (error) {
					console.error("Error fetching access token:", error);
				});
			}).catch(function (error) {
				console.error("Error fetching cart items:", error);
			});
	}
	if (event.target.closest(".cart-remove-button a")) {
		event.preventDefault();
		var cartGrid = event.target.closest(".cart-grid");
		if (cartGrid) {
			var cartUpdateData = {};
			cartUpdateData[cartGrid.getAttribute("data-id")] = 0;
			var accessToken = getCookie("accessToken");
			// console.log('cartUpdateData ', cartUpdateData, ' accessToken ', accessToken)
			cartUpdate(cartUpdateData, accessToken);
			cartGrid.remove();
			var activeErrorMessages = document.querySelectorAll(".cart-grid p.error-massage.active");
			if (activeErrorMessages.length > 0) {
				document.querySelector(".remove-allitem").classList.remove("hide");
				document.querySelector(".remove-allitem").style.display = "block";
				var checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
				checkoutButton.disabled = true;
				checkoutButton.classList.add("disabled");
			} else {
				document.querySelector(".remove-allitem").style.display = "none";
				var checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
				checkoutButton.disabled = false;
				checkoutButton.classList.remove("disabled");
				document.querySelector(".remove-allitem").classList.add("hide");
			}
		}
	}
	if (event.target.matches(".cross")) {
		document.querySelector(".cart-popup").style.display = "none";
		document.body.classList.remove("bg-hidden");
		location.reload();
	}
	if (event.target.matches(".gotocheckout")) {
		if (event.target.classList.contains("checkoutbtn")) {
			event.preventDefault();
			fetch("/cart/update.js", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					attributes: {
						"_order tag": true
					}
				})
			})
				.then(function (response) {
					if (response.ok) {
						document.location.href = "/cart/checkout";
					}
				})
				.catch(function (error) {
					console.error("Error:", error);
				});
		} else {
			document.location.href = "/cart/checkout";
		}
	}
	if (event.target.matches(".remove-allitem")) {
		event.preventDefault();
		if (confirm("Are you sure you want to proceed?")) {
			var cartUpdateData = {};
			document.querySelectorAll(".cart-grid p.error-massage.active").forEach(function (errorMessage) {
				cartUpdateData[errorMessage.parentElement.dataset.id] = 0;
			});
			fetchAccessToken()
				.then(function (response) {
					cartUpdate(cartUpdateData, response.accessToken, true);
					let errorMessages = document.querySelectorAll(".cart-grid p.error-massage.active");
					for (let i = 0; i < errorMessages.length; i++) {
						let errorMessage = errorMessages[i];
						errorMessage.closest(".cart-grid").remove();
					}
					document.querySelector(".remove-allitem").style.display = "none";
					localStorage.setItem("testings", JSON.stringify([]));
				})
				.catch(function (error) {
					console.error("Error fetching access token:", error);
				});
		}
	}
});