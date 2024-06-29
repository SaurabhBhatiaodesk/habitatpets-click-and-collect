async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

async function fetchAccessToken() {
    try {
        const response = await fetch(`https://clickncollect-12d7088d53ee.herokuapp.com/api/get?shop=${location.hostname}`, {
            headers: { "Content-Type": "application/json", Accept: "application/json" }
        });
        if (!response.ok) throw new Error("Network response was not ok.");
        return await response.json();
    } catch (error) {
        console.error("Error fetching access token:", error);
        throw error;
    }
}

function getCookie(name) {
    const cookieArr = document.cookie.split(";").map(cookie => cookie.trim().split("="));
    const cookie = cookieArr.find(c => c[0] === name);
    return cookie ? decodeURIComponent(cookie[1]) : null;
}

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = `${name}=${value}${expires}; path=/`;
}

async function getLocations(accessToken, selectedLocation = "") {
    try {
        const response = await fetch("/admin/api/2024-04/locations.json", {
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

        document.querySelector(".popup-box .address-popup").style.display = "block";
    } catch (error) {
        console.error("Error fetching locations:", error);
    }
}

function renderLocations(locations, selectedLocation) {
    const locationsContainer = document.querySelector(".popup-box .address-popup .locationss");
    locationsContainer.innerHTML = "";

    if (locations.length > 0) {
        locations.forEach(location => {
            if (location.name !== "Snow City Warehouse") {
                const locationElement = document.createElement("div");
                locationElement.classList.add("popup-inner-col");
                locationElement.innerHTML = `
                    <div class="add">
                        <span>
                            <input type="radio" id="${location.id}" class="locations" data-name="${location.name}" name="locations" value="HTML" ${location.name === selectedLocation ? 'checked="checked"' : ''}>
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
                        <a href="https://www.google.com/maps/dir/${location.origin}/${location.address1} ${location.city} ${location.zip} ${location.province} ${location.country_name}" target="_blank">
                            Get Directions >>
                        </a>
                    </button>
                `;
                locationsContainer.appendChild(locationElement);
            }
        });
    } else {
        const noStoresElement = document.createElement("div");
        noStoresElement.classList.add("popup-inner-col");
        noStoresElement.innerHTML = '<div class="add">Stores not available for entered location</div>';
        locationsContainer.appendChild(noStoresElement);
    }
}

function showModal() {
    const selectedLocation = getCookie("storelocationName");
    const customerLocation = getCookie("customerlocation");
    document.querySelector(".location").value = customerLocation;

    fetchAccessToken()
        .then(response => getLocations(response.accessToken, selectedLocation))
        .catch(error => console.error("Error fetching locations:", error));

    const popupModal = document.querySelector(".popup-modal");
    if (popupModal) popupModal.style.display = "block";
}

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
        event.preventDefault();
        const popupModal = document.querySelector(".popup-modal");
        popupModal.style.display = "none";
        document.querySelector(".setlocationbtn").style.display = "none";
        popupModal.classList.remove("showmodal");
    });

    document.body.addEventListener("click", event => {
        if (!event.target.closest(".popup-modal")) {
            document.querySelector(".popup-modal").style.display = "none";
        }
    });

    document.addEventListener("click", event => {
        if (event.target.matches("button.check-btn")) {
            const zipcode = document.querySelector(".location").value;
            setCookie("customerlocation", zipcode);
            fetchAccessToken()
                .then(response => getLocations(response.accessToken))
                .catch(error => console.error("Error fetching locations:", error));
        }
    });

    document.addEventListener("change", event => {
        if (event.target.matches(".popup-modal .address-popup input.locations")) {
            document.querySelector(".setlocationbtn").style.display = "block";
            setCookie("storelocationName", event.target.nextElementSibling.textContent);
            setCookie("storelocation", event.target.id);
        }
    });
});

if (document.querySelector(".popup-modal")) {
    showModal();
}
