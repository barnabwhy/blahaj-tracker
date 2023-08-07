const GOOGLE_API_KEY = "AIzaSyCe4v19GE_1Y8bN-x31b3__RxRXvNWDZPk";
export async function onRequest(context) {
    let { lat, lon } = context.request.query;
    return fetch("https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lon+"&sensor=true&key="+GOOGLE_API_KEY);
}