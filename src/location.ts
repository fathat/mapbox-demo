import * as ui from "./uielements";
import { Vector2 } from "three";
import { accessToken } from "./token";

// missing a .d.ts for this module so use the old school require syntax
const TileBelt: any = require('@mapbox/tilebelt');

// represents a point on the globe, with an integer zoom level (between 0-15)
export interface ILocation {
    lon: number
    lat: number
    zoom: number
}

export class GlobeLocation implements ILocation {
    constructor(
        public lon: number, 
        public lat: number, 
        public zoom: number
    ) {}
}

/*
    Returns whatever the current location is set to. 
*/
export function currentLocation() {
    return new GlobeLocation(
        parseFloat(ui.inputLon.value),
        parseFloat(ui.inputLat.value),
        parseInt(ui.inputZoom.value)
    );
}

/* 
    This is assuming a UVMap from the NASA blue-marble collection
    mapped to a standard UV sphere. 

    This number might be approximate? It seems to roughly align with
    where things should be, but I haven't looked closely into 
    specific projections etc. 
*/
export function sphereUVtoLatLon(uv: Vector2): Vector2 {
    const lat: number = (uv.y - 0.5) * -180;
    const lon: number = (uv.x - 0.5) * 360;
    return new Vector2(lon, lat)
}

/*
    This takes a lat/lon/zooom location, determines the tile bounding box (in lat/lon),
    then converts that to texture coordates (0-1)
*/
export function locationToUVbox(location: ILocation) {
    const tile = TileBelt.pointToTile(location.lon, location.lat, location.zoom);
    const bbox = TileBelt.tileToBBOX(tile);
    let [w, s, e, n] = bbox;
    w += 180;
    e += 180;
    s += 90;
    n += 90;
    return [w/360.0, s/180.0, e/360.0, n/180.0];
}

/*
    Loads raw tile data into a provided image object.
*/
export function loadTileFromLatLonIntoImage(location: ILocation, targetImage: HTMLImageElement) {
    const tile = TileBelt.pointToTile(location.lon, location.lat, location.zoom);
    const [tx, ty, tz] = tile;    
    let apiUrl = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${tz}/${tx}/${ty}.pngraw?access_token=${accessToken}`;
    targetImage.src = apiUrl;
}