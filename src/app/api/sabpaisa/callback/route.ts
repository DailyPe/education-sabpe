import { NextRequest, NextResponse } from "next/server";

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

        // TODO: Decrypt if encrypted, or use jsonData directly
        // TODO: Save to Firestore
        // For now, just log and return success

        console.log("Callback data received:", {
            hasEncrypted: !!encResponse,
            hasJson: !!jsonData,
            encLength: encResponse?.length || 0,
        });

        // Return success to SabPaisa
        return NextResponse.json(
            {
                success: true,
                message: "Callback received and processed"
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

