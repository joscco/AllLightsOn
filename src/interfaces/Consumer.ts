import {ConnectionPartner} from "./ConnectionPartner";

export interface Consumer extends ConnectionPartner{
    consume(power: boolean): void;
}