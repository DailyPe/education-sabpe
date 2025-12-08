import { NextRequest, NextResponse } from "next/server";

const LAMBDA_ENDPOINT =
    process.env.SABPAISA_LAMBDA_ENDPOINT ||
    "https://sshykykxg4.execute-api.ap-south-1.amazonaws.com/prod/sabpaisa/initiate";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, payerName, payerEmail, payerMobile, utilityId } = body;

        // Validate required fields
        if (!amount || !payerName || !payerEmail || !payerMobile) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing required fields: amount, payerName, payerEmail, payerMobile",
                },
                { status: 400 }
            );
        }

        // Validate amount
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid amount",
                },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(payerEmail)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid email address",
                },
                { status: 400 }
            );
        }

        // Validate mobile number (Indian format)
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(payerMobile)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid mobile number. Must be a 10-digit Indian mobile number",
                },
                { status: 400 }
            );
        }

        // Get the host from request headers to build callback URL
        const host = request.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";
        const callbackUrl = `${protocol}://${host}/api/sabpaisa/return`;

        console.log("Initiating payment with callback URL:", callbackUrl);

        // Forward request to Lambda function
        const lambdaResponse = await fetch(LAMBDA_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: amountNum.toFixed(2),
                payerName: payerName.trim(),
                payerEmail: payerEmail.trim(),
                payerMobile: payerMobile.trim(),
                utilityId: utilityId || "education",
                callbackUrl: callbackUrl,
            }),
        });

        const lambdaData = await lambdaResponse.json();

        if (!lambdaResponse.ok) {
            console.error("Lambda error:", lambdaData);
            return NextResponse.json(
                {
                    success: false,
                    error: lambdaData.error || "Payment initiation failed",
                },
                { status: lambdaResponse.status }
            );
        }

        // Return Lambda response to client
        return NextResponse.json(lambdaData);
    } catch (error: any) {
        console.error("SabPaisa initiate API error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Internal server error",
            },
            { status: 500 }
        );
    }
}

