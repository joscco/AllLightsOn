import {ConnectionPartner} from "./ConnectionPartner";

export interface Provider extends ConnectionPartner {
    consume(power: boolean): void;
}