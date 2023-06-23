import Point from "@/plottables/Point";
import { SEPoint } from "./SEPoint";
export class SEEarthPoint extends SEPoint {
    private _longitude: number;
    private _latitude: number;
    private _coordinate: number[]; // [x,y,z]
    constructor(point: Point,longitude:number,latitude:number,coordinate:number[]){
        super(point);
        this._longitude = longitude;
        this._latitude = latitude;
        this._coordinate = coordinate;
        point.updateDisplay();
    }
    get longitude():number{
        return this._longitude;
    }
    get latitude():number{
        return this._latitude;
    }
    get coordinate():number[]{
        return this._coordinate;
    }

}