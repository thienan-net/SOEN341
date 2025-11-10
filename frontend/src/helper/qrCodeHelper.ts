import { BASE_URL } from "../config";
import { User } from "../contexts/AuthContext"

export const getQRCodeURL = (ticketID : string) : string => {
    return BASE_URL + "/validate-qrcode/" + ticketID;
    
}