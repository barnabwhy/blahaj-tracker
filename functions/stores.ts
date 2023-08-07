const IKEA_API_STORES = "https://www.ikea.com/gb/en/meta-data/navigation/stores-detailed.json";
export function onRequest(context) {
    return fetch(IKEA_API_STORES);
}
