import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/../firebase/client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

async function decryptSabPaisaResponse(encryptedHex: string, authKey: string, authIV: string): Promise<any> {
    try {
        const encryptedBuffer = Buffer.from(encryptedHex, "hex");
        const hmacReceived = encryptedBuffer.subarray(0, 48);
        const iv = encryptedBuffer.subarray(48, 60);
        const encryptedDataWithTag = encryptedBuffer.subarray(60);

        const keyBuffer = Buffer.from(authKey, "base64");
        const hmacKeyBuffer = Buffer.from(authIV, "base64");

        const hmacCalculated = crypto
            .createHmac("sha384", hmacKeyBuffer)
            .update(encryptedBuffer.subarray(48))
            .digest();

        if (!hmacReceived.equals(hmacCalculated)) {
            throw new Error("HMAC verification failed");
        }

        const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv);
        const tag = encryptedDataWithTag.subarray(-16);
        const encryptedData = encryptedDataWithTag.subarray(0, -16);

        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedData, undefined, "utf8");
        decrypted += decipher.final("utf8");

        const params = new URLSearchParams(decrypted);
        const result: any = {};
        params.forEach((value, key) => {
            result[key] = value;
        });

        return result;
    } catch (error) {
        console.error("Decryption error:", error);
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { encResponse } = body;

        if (!encResponse) {
            return NextResponse.json(
                { success: false, error: "No encrypted response provided" },
                { status: 400 }
            );
        }

        // Hardcoded authentication keys
        const authKey = "U9hMxZyANd0RxgMlTRYW63hCHWKcLRkyXWmhEtpRQgo=";
        const authIV = "XVJbgKaztKMJNYJicBCkKkAi5gFFsQAorasz4prd6k6RfNiMCuPIl7AzJ/x9PnAL";

        // Decrypt response
        const decryptedData = await decryptSabPaisaResponse(encResponse, authKey, authIV);

        // Extract order ID and determine status
        const orderId =
            decryptedData.clientTxnId ||
            decryptedData.CLIENT_TXN_ID ||
            decryptedData.orderId ||
            decryptedData.ORDER_ID ||
            `payment_${Date.now()}`;

        const status = (decryptedData.status || decryptedData.STATUS || "").toUpperCase();
        const responseCode = decryptedData.responseCode || decryptedData.RESPONSE_CODE;

        const isSuccess =
            status.includes("SUCCESS") ||
            status.includes("COMPLETED") ||
            status.includes("APPROVED") ||
            responseCode === "000";

        // Prepare Firestore data
        const firestoreData = {
            orderId,
            status: isSuccess ? "SUCCESS" : "FAILED",
            rawStatus: status,
            responseCode: responseCode || null,
            amount: decryptedData.amount || decryptedData.AMOUNT || "0",
            payerName: decryptedData.payerName || decryptedData.PAYER_NAME || null,
            payerEmail: decryptedData.payerEmail || decryptedData.PAYER_EMAIL || null,
            payerMobile: decryptedData.payerMobile || decryptedData.PAYER_MOBILE || null,
            bankTxnId: decryptedData.bankTxnId || decryptedData.BANK_TXN_ID || null,
            sabpaisaTxnId: decryptedData.sabpaisaTxnId || decryptedData.SABPAISA_TXN_ID || null,
            paymentMode: decryptedData.paymentMode || decryptedData.PAYMENT_MODE || null,
            statusMessage: decryptedData.statusMessage || decryptedData.STATUS_MESSAGE || null,
            timestamp: serverTimestamp(),
            callbackReceivedAt: new Date().toISOString(),
            rawData: decryptedData,
        };

        // Save to Firestore using client SDK
        try {
            const paymentRef = doc(db, "payments", orderId);
            await setDoc(paymentRef, firestoreData, { merge: true });
        } catch (firestoreError: any) {
            console.error("Failed to save to Firestore:", firestoreError.message);
            // Continue even if Firestore fails - payment will still show success/failure to user
        }

        // Return response to frontend
        return NextResponse.json({
            success: true,
            data: {
                orderId,
                amount: decryptedData.amount || decryptedData.AMOUNT,
                status: isSuccess ? "SUCCESS" : "FAILED",
                isSuccess,
                payerName: decryptedData.payerName || decryptedData.PAYER_NAME,
                statusMessage: decryptedData.statusMessage || decryptedData.STATUS_MESSAGE,
            }
        });

    } catch (error: any) {
        console.error("Process callback error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Processing failed" },
            { status: 500 }
        );
    }
}

