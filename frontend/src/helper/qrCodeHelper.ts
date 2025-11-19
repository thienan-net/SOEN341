import { BASE_URL } from "../config";

export const getQRCodeURL = (ticketID : string) : string => {
    return BASE_URL + "/validate-qrcode/" + ticketID;
    
}