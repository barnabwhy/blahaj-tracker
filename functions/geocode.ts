const GOOGLE_API_KEY = "AIzaSyCe4v19GE_1Y8bN-x31b3__RxRXvNWDZPk";
export async function onRequest(context) {
    let lat = new URL(context.request.url).searchParams.get("lat");
    let lon = new URL(context.request.url).searchParams.get("lon");
    return fetch("https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lon+"&sensor=true&key="+GOOGLE_API_KEY);
}