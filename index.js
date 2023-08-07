// const IKEA_API_STORES = "https://www.ikea.com/gb/en/meta-data/navigation/stores-detailed.json";
const IKEA_API_STORES = "stores-detailed.json";
const IKEA_API_STOCK = "https://api.ingka.ikea.com/cia/availabilities/ru/gb?itemNos=%itemNos%&zip=%postCode%";
const IKEA_CLIENT_ID = "b6c117e5-ae61-4ef5-b4cc-e0b1e37f0631";
const GOOGLE_API_KEY = "AIzaSyCe4v19GE_1Y8bN-x31b3__RxRXvNWDZPk";

let storeData = [];
(async () => {
    fetch(IKEA_API_STORES)
        .then((response) => response.json())
        .then(async (data) => {
            let position = await getCurrentPosition();
            storeData = data.sort((a, b) => getDistance(position.coords.latitude, position.coords.longitude, a.lat, a.lng)
                - getDistance(position.coords.latitude, position.coords.longitude, b.lat, b.lng));

            renderBlahajStock(await getBlahajStockNearby());
        })
        .catch(err => {
            document.querySelector("#blahaj").innerHTML = `<h3>${err}</h3>`;
        });
})();

async function getBlahajStockNearby() {
    let stock = await getIkeaStock([20540663, 30373588], await getCurrentPostCode());
    let storeStock = {};
    for(let s of stock) {
        // console.log(s)
        s.availableStocks = (s.availableStocks || []).map(a => { return { itemNo: s.itemKey.itemNo, quantity: a.quantity, type: a.type, restocks: a.restocks || [] } })
        if(!storeStock[s.classUnitKey.classUnitCode]) {
            storeStock[s.classUnitKey.classUnitCode] = {
                availableStocks: [...s.availableStocks]
            }
        } else {
            storeStock[s.classUnitKey.classUnitCode].availableStocks.push(...s.availableStocks);
        }
    }

    return storeStock;
}

async function renderBlahajStock(storeStock) {
    let position = await getCurrentPosition();
    let blahajEl = document.querySelector("#blahaj");
    blahajEl.innerHTML = "";
    for(let i = 0; i < storeData.length; i++) {
        let store = storeData[i];
        let avail = storeStock[store.id].availableStocks.find(s => s.itemNo == 20540663);
        if(avail && avail.quantity > 0) {
            blahajEl.innerHTML += `<div>
            <h3>Nearest BLÅHAJ (55cm)</h3>
            <p>${store.name} (${getDistance(position.coords.latitude, position.coords.longitude, store.lat, store.lng).toFixed(1)}km)</p>
            <p>${avail.quantity} in stock</p>
            </div>`
            break;
        }
        if(i == storeData.length - 1) {
            blahajEl.innerHTML += `<div>
            <h3>Nearest BLÅHAJ (55cm)</h3>
            <p>Out of stock everywhere</p>
            <p>😭</p>
            </div>`          
        }
    }
    for(let i = 0; i < storeData.length; i++) {
        let store = storeData[i];
        let avail = storeStock[store.id].availableStocks.find(s => s.itemNo == 30373588) || { quantity: 0, restocks: [] };
        if(avail && avail.quantity > 0) {
            blahajEl.innerHTML += `<div>
            <h3>Nearest BLÅHAJ (100cm)</h3>
            <p>${store.name} (${getDistance(position.coords.latitude, position.coords.longitude, store.lat, store.lng).toFixed(1)}km)</p>
            <p>${avail.quantity} in stock</p>
            </div>`
            break;
        }
        if(i == storeData.length - 1) {
            blahajEl.innerHTML += `<div>
            <h3>Nearest BLÅHAJ (100cm)</h3>
            <p>Out of stock everywhere</p>
            <p>😭</p>
            </div>`          
        }
    }

    blahajEl.innerHTML += '<br><h2>IKEA stores (sorted by distance)</h2>';

    for(let store of storeData) {
        let avail55 = storeStock[store.id].availableStocks.find(s => s.itemNo == 20540663) || { quantity: 0, restocks: [] };
        let avail100 = storeStock[store.id].availableStocks.find(s => s.itemNo == 30373588) || { quantity: 0, restocks: [] };
        blahajEl.innerHTML += `<div>
        <h3>${store.name} (${getDistance(position.coords.latitude, position.coords.longitude, store.lat, store.lng).toFixed(1)}km)</h3>
        <span>BLÅHAJ (55cm): ${avail55.quantity} in stock</span> ${(avail55.restocks.length > 0 ? `<h6>Restocking ${avail55.restocks[0].quantity} between ${avail55.restocks[0].earliestDate} and ${avail55.restocks[0].latestDate}</h6>` : "")}
        <br>
        <span>BLÅHAJ (100cm): ${avail100.quantity} in stock</span> ${(avail100.restocks.length > 0 ? `<h6>Restocking ${avail100.restocks[0].quantity} between ${avail100.restocks[0].earliestDate} and ${avail100.restocks[0].latestDate}<h6>` : "")}
        </div>`
    }
}

let cachedPostCode;
function getCurrentPostCode() {
    return new Promise(async (resolve, reject) => {
        if(cachedPostCode)
            return resolve(cachedPostCode);

        let position = await getCurrentPosition();
        reverseGeoLookup(position.coords.latitude, position.coords.longitude)
        .then(postCode => {
            cachedPostCode = postCode;
            resolve(postCode);   
        })
        .catch(reject);
    })
}

function reverseGeoLookup(lat, lon) {
    return new Promise((resolve, reject) => {
        fetch("https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lon+"&sensor=true&key="+GOOGLE_API_KEY)
            .then((response) => response.json())
            .then((data) => {
                let result = data.results;
                for(var i = 0, length = result.length; i < length; i++) {
                    //each result has an address with multiple parts (it's all in the reference)
                    for(var j = 0; j < result[i].address_components.length; j++) {
                        var component = result[i].address_components[j]
                        //if the address component has postal code then write it out
                        if(~component.types.indexOf("postal_code")) {
                            return resolve(component.long_name)
                        }
                    }
                }
                reject("No postcode found");
            });
    });
}

function getIkeaStock(itemNos, postCode) {
    return new Promise((resolve, reject) => {
        fetch(IKEA_API_STOCK.replace("%itemNos%", itemNos.join(",")).replace("%postCode%", postCode),
            {
                headers: {
                    'X-Client-ID': IKEA_CLIENT_ID
                }
            })
            .then((response) => response.json())
            .then((results) => {
                resolve(results.data.filter(d => d.classUnitKey.classUnitType == "STO"))
            })
            .catch(reject);
    });
}

function getDistance(lat1, lon1, lat2, lon2) 
{
    var R = 6371;
    var dLat = deg2Rad(lat2-lat1);
    var dLon = deg2Rad(lon2-lon1);
    var lat1 = deg2Rad(lat1);
    var lat2 = deg2Rad(lat2);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c;
    return d;
}
function deg2Rad(Value) 
{
    return Value * Math.PI / 180;
}

let cachedPosition;
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if(cachedPosition)
            return resolve(cachedPosition);
            
        if (navigator.geolocation) {
            var timeoutVal = 10 * 1000 * 1000;
            navigator.geolocation.getCurrentPosition(
                (position) => {    
                    cachedPosition = position;
                    resolve(position);   
                }, 
                (err) => reject(err.message),
                { enableHighAccuracy: true, timeout: timeoutVal, maximumAge: 0 }
            );
        } else {
            reject("Geolocation not supported");
        }
    });
}