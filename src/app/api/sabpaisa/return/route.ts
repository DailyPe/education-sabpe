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

// Handle both GET and POST requests
export async function GET(request: NextRequest) {
    return handleReturn(request);
}

export async function POST(request: NextRequest) {
    return handleReturn(request);
}

async function handleReturn(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const contentType = request.headers.get("content-type") || "";

        let encResponse: string | null = null;

        // Try to get encrypted response from different sources
        if (searchParams.has("encResponse")) {
            encResponse = searchParams.get("encResponse");
        } else if (searchParams.has("ENCDATA")) {
            encResponse = searchParams.get("ENCDATA");
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await request.formData();
            encResponse = formData.get("encResponse") as string || formData.get("ENCDATA") as string;
        } else if (contentType.includes("application/json")) {
            const body = await request.json();
            encResponse = body.encResponse || body.ENCDATA || body.encData;
        }

        if (!encResponse) {
            console.error("No encrypted response found");
            return NextResponse.redirect(new URL("/payment/failure?error=no_data", request.url));
        }

        console.log("Received encrypted response, length:", encResponse.length);

        // Hardcoded authentication keys
        const authKey = "U9hMxZyANd0RxgMlTRYW63hCHWKcLRkyXWmhEtpRQgo=";
        const authIV = "XVJbgKaztKMJNYJicBCkKkAi5gFFsQAorasz4prd6k6RfNiMCuPIl7AzJ/x9PnAL";

        // Decrypt the response
        const decryptedData = await decryptSabPaisaResponse(encResponse, authKey, authIV);
        console.log("Decrypted data:", decryptedData);

        // Determine success or failure
        const status = (decryptedData.status || decryptedData.STATUS || "").toUpperCase();
        const responseCode = decryptedData.responseCode || decryptedData.RESPONSE_CODE;
        const orderId = decryptedData.clientTxnId || decryptedData.CLIENT_TXN_ID || `payment_${Date.now()}`;

        const isSuccess =
            status.includes("SUCCESS") ||
            status.includes("COMPLETED") ||
            status.includes("APPROVED") ||
            responseCode === "000";

        console.log("Payment result:", {
            orderId,
            status,
            isSuccess,
            amount: decryptedData.amount || decryptedData.AMOUNT,
            payerName: decryptedData.payerName || decryptedData.PAYER_NAME,
        });

        // Save to Firestore using client SDK
        try {
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
                returnReceivedAt: new Date().toISOString(),
                rawData: decryptedData,
            };

            const paymentRef = doc(db, "payments", orderId);
            await setDoc(paymentRef, firestoreData, { merge: true });

            console.log(`✅ Payment data saved to Firestore: ${orderId}`);
        } catch (firestoreError) {
            console.error("⚠️ Failed to save to Firestore:", firestoreError);
            // Continue with redirect even if Firestore save fails
        }

        // Redirect to appropriate page
        if (isSuccess) {
            const successUrl = new URL("/payment/success", request.url);
            successUrl.searchParams.set("orderId", orderId);
            successUrl.searchParams.set("amount", decryptedData.amount || decryptedData.AMOUNT || "0");
            return NextResponse.redirect(successUrl);
        } else {
            const failureUrl = new URL("/payment/failure", request.url);
            failureUrl.searchParams.set("orderId", orderId);
            failureUrl.searchParams.set("reason", decryptedData.statusMessage || decryptedData.STATUS_MESSAGE || "Payment failed");
            return NextResponse.redirect(failureUrl);
        }

    } catch (error: any) {
        console.error("SabPaisa return handler error:", error);
        return NextResponse.redirect(new URL(`/payment/failure?error=${encodeURIComponent(error.message)}`, request.url));
    }
}

