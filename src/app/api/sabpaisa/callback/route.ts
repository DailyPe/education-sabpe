import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/../firebase/client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// Decrypt SabPaisa response
async function decryptSabPaisaResponse(encryptedHex: string, authKey: string, authIV: string): Promise<any> {
    try {
        // Convert hex string to buffer
        const encryptedBuffer = Buffer.from(encryptedHex, "hex");

        // Extract components:
        // HMAC (48 bytes) + IV (12 bytes) + EncryptedData + Tag (16 bytes)
        const hmacReceived = encryptedBuffer.subarray(0, 48);
        const iv = encryptedBuffer.subarray(48, 60);
        const encryptedDataWithTag = encryptedBuffer.subarray(60);

        // Decode keys from base64
        const keyBuffer = Buffer.from(authKey, "base64");
        const hmacKeyBuffer = Buffer.from(authIV, "base64"); // authIV is actually the HMAC key

        // Verify HMAC
        const hmacCalculated = crypto
            .createHmac("sha384", hmacKeyBuffer)
            .update(encryptedBuffer.subarray(48)) // Everything after HMAC
            .digest();

        if (!hmacReceived.equals(hmacCalculated)) {
            throw new Error("HMAC verification failed");
        }

        // Decrypt using AES-GCM
        const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv);

        // Extract tag (last 16 bytes) and encrypted data
        const tag = encryptedDataWithTag.subarray(-16);
        const encryptedData = encryptedDataWithTag.subarray(0, -16);

        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedData, undefined, "utf8");
        decrypted += decipher.final("utf8");

        // Parse the decrypted string (URLSearchParams format)
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
        const contentType = request.headers.get("content-type") || "";

        let encResponse: string | null = null;
        let jsonData: any = null;

        // Handle different content types
        if (contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await request.formData();
            encResponse = formData.get("encResponse") as string || formData.get("ENCDATA") as string;
        } else if (contentType.includes("application/json")) {
            const body = await request.json();
            encResponse = body.encResponse || body.ENCDATA || body.encData;
            jsonData = body;
        } else {
            const text = await request.text();
            const params = new URLSearchParams(text);
            encResponse = params.get("encResponse") || params.get("ENCDATA");
        }

        console.log("SabPaisa callback received");
        console.log("Content-Type:", contentType);

        if (!encResponse && !jsonData) {
            console.error("No encrypted response or JSON data found in callback");
            return NextResponse.json(
                { success: false, error: "No data found" },
                { status: 400 }
            );
        }

        let paymentData: any = null;

        // Decrypt if encrypted response is present
        if (encResponse) {
            // Hardcoded authentication keys
            const authKey = "U9hMxZyANd0RxgMlTRYW63hCHWKcLRkyXWmhEtpRQgo=";
            const authIV = "XVJbgKaztKMJNYJicBCkKkAi5gFFsQAorasz4prd6k6RfNiMCuPIl7AzJ/x9PnAL";

            try {
                paymentData = await decryptSabPaisaResponse(encResponse, authKey, authIV);
                console.log("Decrypted payment data:", paymentData);
            } catch (error) {
                console.error("Failed to decrypt callback data:", error);
                return NextResponse.json(
                    { success: false, error: "Decryption failed" },
                    { status: 400 }
                );
            }
        } else if (jsonData) {
            // Use JSON data directly if no encryption
            paymentData = jsonData;
        }

        // Extract order ID (try different field names)
        const orderId =
            paymentData.clientTxnId ||
            paymentData.CLIENT_TXN_ID ||
            paymentData.orderId ||
            paymentData.ORDER_ID ||
            paymentData.txnId ||
            paymentData.TXN_ID ||
            `payment_${Date.now()}`;

        // Determine payment status
        const status = (paymentData.status || paymentData.STATUS || "").toUpperCase();
        const responseCode = paymentData.responseCode || paymentData.RESPONSE_CODE;
        const isSuccess =
            status.includes("SUCCESS") ||
            status.includes("COMPLETED") ||
            status.includes("APPROVED") ||
            responseCode === "000";

        // Prepare data for Firestore
        const firestoreData = {
            orderId,
            status: isSuccess ? "SUCCESS" : "FAILED",
            rawStatus: status,
            responseCode: responseCode || null,
            amount: paymentData.amount || paymentData.AMOUNT || "0",
            payerName: paymentData.payerName || paymentData.PAYER_NAME || null,
            payerEmail: paymentData.payerEmail || paymentData.PAYER_EMAIL || null,
            payerMobile: paymentData.payerMobile || paymentData.PAYER_MOBILE || null,
            bankTxnId: paymentData.bankTxnId || paymentData.BANK_TXN_ID || null,
            sabpaisaTxnId: paymentData.sabpaisaTxnId || paymentData.SABPAISA_TXN_ID || null,
            paymentMode: paymentData.paymentMode || paymentData.PAYMENT_MODE || null,
            statusMessage: paymentData.statusMessage || paymentData.STATUS_MESSAGE || null,
            timestamp: serverTimestamp(),
            callbackReceivedAt: new Date().toISOString(),
            rawData: paymentData,
        };

        // Save to Firestore using client SDK
        try {
            const paymentRef = doc(db, "payments", orderId);
            await setDoc(paymentRef, firestoreData, { merge: true });

            console.log(`✅ Payment data saved to Firestore: ${orderId}`);
            console.log("Payment status:", isSuccess ? "SUCCESS" : "FAILED");
        } catch (firestoreError) {
            console.error("⚠️ Failed to save to Firestore:", firestoreError);
            // Still return success to SabPaisa to avoid retries
        }

        // Return success to SabPaisa
        return NextResponse.json(
            {
                success: true,
                message: "Callback received and processed",
                orderId: orderId
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("SabPaisa callback error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Callback processing failed"
            },
            { status: 500 }
        );
    }
}

