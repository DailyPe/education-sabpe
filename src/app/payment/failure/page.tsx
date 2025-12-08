"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentFailurePage() {
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState<string | null>(null);
    const [reason, setReason] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const orderIdParam = searchParams.get("orderId");
        const reasonParam = searchParams.get("reason");
        const errorParam = searchParams.get("error");

        setOrderId(orderIdParam);
        setReason(reasonParam);
        setError(errorParam);
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-lightBg to-white py-12">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 text-center">
                    {/* Failure Icon */}
                    <div className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-times-circle text-5xl text-red-600"></i>
                    </div>

                    {/* Failure Message */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Failed</h1>
                    <p className="text-gray-600 text-lg mb-6">
                        Unfortunately, your payment could not be processed.
                    </p>

                    {/* Transaction Details */}
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 mb-6 text-left border border-red-200">
                        <h3 className="font-semibold text-gray-900 mb-4 text-center">Transaction Details</h3>
                        <div className="space-y-3 text-sm">
                            {orderId && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Transaction ID:</span>
                                    <span className="font-mono font-medium text-gray-900 bg-white px-3 py-1 rounded">{orderId}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Status:</span>
                                <span className="font-medium text-red-600 flex items-center">
                                    <i className="fas fa-times-circle mr-1"></i>
                                    Failed
                                </span>
                            </div>
                            {reason && (
                                <div className="flex justify-between items-start">
                                    <span className="text-gray-600 flex-shrink-0">Reason:</span>
                                    <span className="font-medium text-gray-900 text-right">{reason}</span>
                                </div>
                            )}
                            {error && (
                                <div className="flex justify-between items-start">
                                    <span className="text-gray-600 flex-shrink-0">Error:</span>
                                    <span className="font-medium text-gray-900 text-right">{error}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Date & Time:</span>
                                <span className="font-medium text-gray-900">{new Date().toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Possible Reasons */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start">
                            <i className="fas fa-exclamation-triangle text-yellow-600 text-xl mr-3 mt-1"></i>
                            <div className="text-left">
                                <p className="text-sm text-yellow-900 font-medium mb-2">Common reasons for payment failure:</p>
                                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                                    <li>Insufficient balance in your account</li>
                                    <li>Transaction declined by your bank</li>
                                    <li>Payment timeout or cancellation</li>
                                    <li>Incorrect payment details</li>
                                    <li>Network connectivity issues</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Information */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start">
                            <i className="fas fa-info-circle text-blue-600 text-xl mr-3 mt-1"></i>
                            <div className="text-left">
                                <p className="text-sm text-blue-900 font-medium mb-1">What happens next?</p>
                                <p className="text-sm text-blue-700">
                                    If any amount was debited from your account, it will be automatically refunded
                                    within 5-7 business days. You can try the payment again.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
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

                {/* Support Card */}
                <div className="mt-8 bg-white rounded-lg p-6 shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <i className="fas fa-headset text-primary mr-2"></i>
                        Need Help?
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p className="flex items-center">
                            <i className="fas fa-phone mr-3 text-primary w-5"></i>
                            Call us: <a href="tel:+919327282729" className="text-primary hover:underline ml-1 font-medium">+91 93272 82729</a>
                        </p>
                        <p className="flex items-center">
                            <i className="fas fa-clock mr-3 text-primary w-5"></i>
                            Support Hours: Mon - Sat, 9:00 AM to 6:00 PM
                        </p>
                        <p className="flex items-center">
                            <i className="fas fa-building mr-3 text-primary w-5"></i>
                            KB ToPay Finovative LLP
                        </p>
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">
                            <i className="fas fa-shield-alt mr-2 text-green-600"></i>
                            Your payment information is secure. No amount was charged for this failed transaction.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

