import React from "react";
import { getQRCodeURL } from "../helper/qrCodeHelper";
import { useAuth } from "../contexts/AuthContext";
import { QRCodeCanvas } from "qrcode.react";
import { Link } from "react-router-dom";

interface Props {
    ticketID: string;
    size?: number;
}

export const QRCode = (props: Props) => {
    const { ticketID, size = 96 } = props
    const { user } = useAuth();
    return (
        <Link to={getQRCodeURL(ticketID)}>
            <QRCodeCanvas  
                value={getQRCodeURL(ticketID)}
                size={size} // size in pixels
                bgColor="#ffffff"
                fgColor="#000000"
                level="H" // error correction level (L, M, Q, H)
                includeMargin={true}
                className='mx-auto mb-2'
            />
        </Link>
    )
}