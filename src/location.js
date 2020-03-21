"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ui = __importStar(require("./uielements"));
const three_1 = require("three");
const token_1 = require("./token");
//missing a .d.ts for this module so use the old school require syntax
const TileBelt = require('@mapbox/tilebelt');
class GlobeLocation {
    constructor(lon, lat, zoom) {
        this.lon = lon;
        this.lat = lat;
        this.zoom = zoom;
    }
}
exports.GlobeLocation = GlobeLocation;
/*
    Returns whatever the current location is set to.
*/
function currentLocation() {
    return new GlobeLocation(parseFloat(ui.inputLon.value), parseFloat(ui.inputLat.value), parseInt(ui.inputZoom.value));
}
exports.currentLocation = currentLocation;
/*
    This is assuming a UVMap from the NASA blue-marble collection
    mapped to a standard UV sphere.

    This number might be approximate? It seems to roughly align with
    where things should be, but I haven't looked closely into
    specific projections etc.
*/
function sphereUVtoLatLon(uv) {
    const lat = (uv.y - 0.5) * -180;
    const lon = (uv.x - 0.5) * 360;
    return new three_1.Vector2(lon, lat);
}
exports.sphereUVtoLatLon = sphereUVtoLatLon;
/*
    This takes a lat/lon/zooom location, determines the tile bounding box (in lat/lon),
    then converts that to texture coordates (0-1)
*/
function locationToUVbox(location) {
    const tile = TileBelt.pointToTile(location.lon, location.lat, location.zoom);
    const bbox = TileBelt.tileToBBOX(tile);
    let [w, s, e, n] = bbox;
    w += 180;
    e += 180;
    s += 90;
    n += 90;
    return [w / 360.0, s / 180.0, e / 360.0, n / 180.0];
}
exports.locationToUVbox = locationToUVbox;
/*
    Loads raw tile data into a provided image object.
*/
function loadTileFromLatLonIntoImage(location, targetImage) {
    const tile = TileBelt.pointToTile(location.lon, location.lat, location.zoom);
    const [tx, ty, tz] = tile;
    let apiUrl = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${tz}/${tx}/${ty}.pngraw?access_token=${token_1.accessToken}`;
    targetImage.src = apiUrl;
}
exports.loadTileFromLatLonIntoImage = loadTileFromLatLonIntoImage;
