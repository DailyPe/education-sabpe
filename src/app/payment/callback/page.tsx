"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function CallbackContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "failure">("loading");
    const [paymentData, setPaymentData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processCallback = async () => {
            try {
                // Get encrypted response from URL
                const encResponse = searchParams.get("encResponse") ||
                    searchParams.get("ENCDATA") ||
                    searchParams.get("encData");

                if (!encResponse) {
                    setStatus("failure");
                    setError("No payment data received");
                    return;
                }

                // Call API to process and save
                const response = await fetch("/api/sabpaisa/process-callback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ encResponse }),
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    setStatus("failure");
                    setError(result.error || "Payment processing failed");
                    return;
                }

                // Set payment data and status
                setPaymentData(result.data);
                setStatus(result.data.isSuccess ? "success" : "failure");

            } catch (err: any) {
                console.error("Callback processing error:", err);
                setStatus("failure");
                setError(err.message || "An error occurred");
            }
        };

        processCallback();
    }, [searchParams]);

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gradient-to-b from-lightBg to-white py-12 flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner border-4 border-gray-200 border-t-primary rounded-full w-16 h-16 animate-spin mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment...</h2>
                    <p className="text-gray-600">Please wait while we verify your transaction</p>
                </div>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="min-h-screen bg-gradient-to-b from-lightBg to-white py-12">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 text-center">
                        <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <i className="fas fa-check-circle text-5xl text-green-600"></i>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Successful!</h1>
                        <p className="text-gray-600 text-lg mb-6">
                            Your funds have been added successfully.
                        </p>

                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6 text-left border border-green-200">
                            <h3 className="font-semibold text-gray-900 mb-4 text-center">Transaction Details</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Transaction ID:</span>
                                    <span className="font-mono font-medium text-gray-900 bg-white px-3 py-1 rounded">
                                        {paymentData?.orderId}
                                    </span>
                                </div>
                                {paymentData?.amount && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Amount Paid:</span>
                                        <span className="font-semibold text-green-600 text-lg">
                                            ₹{parseFloat(paymentData.amount).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Status:</span>
                                    <span className="font-medium text-green-600 flex items-center">
                                        <i className="fas fa-check-circle mr-1"></i>
                                        Success
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Date & Time:</span>
                                    <span className="font-medium text-gray-900">{new Date().toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start">
                                <i className="fas fa-info-circle text-blue-600 text-xl mr-3 mt-1"></i>
                                <div className="text-left">
                                    <p className="text-sm text-blue-900 font-medium mb-1">Payment Confirmation</p>
                                    <p className="text-sm text-blue-700">
                                        A confirmation receipt has been sent to your registered email address.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                            <Link
                                href="/add-funds"
                                className="px-6 py-3 bg-gradient-to-r from-secondary to-primary text-white rounded-lg font-bold hover:from-primary hover:to-secondary transition duration-300 shadow-md"
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Add More Funds
                            </Link>
                            <Link
                                href="/"
                                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition duration-300"
                            >
                                <i className="fas fa-home mr-2"></i>
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Failure state
    return (
        <div className="min-h-screen bg-gradient-to-b from-lightBg to-white py-12">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 text-center">
                    <div className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-times-circle text-5xl text-red-600"></i>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Failed</h1>
                    <p className="text-gray-600 text-lg mb-6">
                        Unfortunately, your payment could not be processed.
                    </p>

                    <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 mb-6 text-left border border-red-200">
                        <h3 className="font-semibold text-gray-900 mb-4 text-center">Transaction Details</h3>
                        <div className="space-y-3 text-sm">
                            {paymentData?.orderId && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Transaction ID:</span>
                                    <span className="font-mono font-medium text-gray-900 bg-white px-3 py-1 rounded">
                                        {paymentData.orderId}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Status:</span>
                                <span className="font-medium text-red-600 flex items-center">
                                    <i className="fas fa-times-circle mr-1"></i>
                                    Failed
                                </span>
                            </div>
                            {error && (
                                <div className="flex justify-between items-start">
                                    <span className="text-gray-600 flex-shrink-0">Reason:</span>
                                    <span className="font-medium text-gray-900 text-right">{error}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Date & Time:</span>
                                <span className="font-medium text-gray-900">{new Date().toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                        <Link
                            href="/add-funds"
                            className="px-6 py-3 bg-gradient-to-r from-secondary to-primary text-white rounded-lg font-bold hover:from-primary hover:to-secondary transition duration-300 shadow-md"
                        >
                            <i className="fas fa-redo mr-2"></i>
                            Try Again
                        </Link>
                        <Link
                            href="/"
                            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition duration-300"
                        >
                            <i className="fas fa-home mr-2"></i>
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-b from-lightBg to-white py-12 flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner border-4 border-gray-200 border-t-primary rounded-full w-12 h-12 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}

