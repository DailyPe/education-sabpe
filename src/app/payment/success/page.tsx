"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState<string | null>(null);
    const [amount, setAmount] = useState<string | null>(null);

    useEffect(() => {
        const orderIdParam = searchParams.get("orderId");
        const amountParam = searchParams.get("amount");

        setOrderId(orderIdParam);
        setAmount(amountParam);
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-lightBg to-white py-12">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 text-center">
                    {/* Success Icon */}
                    <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <i className="fas fa-check-circle text-5xl text-green-600"></i>
                    </div>

                    {/* Success Message */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Successful!</h1>
                    <p className="text-gray-600 text-lg mb-6">
                        Your funds have been added successfully.
                    </p>

                    {/* Transaction Details */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6 text-left border border-green-200">
                        <h3 className="font-semibold text-gray-900 mb-4 text-center">Transaction Details</h3>
                        <div className="space-y-3 text-sm">
                            {orderId && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Transaction ID:</span>
                                    <span className="font-mono font-medium text-gray-900 bg-white px-3 py-1 rounded">{orderId}</span>
                                </div>
                            )}
                            {amount && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Amount Paid:</span>
                                    <span className="font-semibold text-green-600 text-lg">₹{parseFloat(amount).toFixed(2)}</span>
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

                    {/* Information */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start">
                            <i className="fas fa-info-circle text-blue-600 text-xl mr-3 mt-1"></i>
                            <div className="text-left">
                                <p className="text-sm text-blue-900 font-medium mb-1">Payment Confirmation</p>
                                <p className="text-sm text-blue-700">
                                    A confirmation receipt has been sent to your registered email address.
                                    Please save the transaction ID for your records.
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
                </div>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-b from-lightBg to-white py-12 flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner border-4 border-gray-200 border-t-primary rounded-full w-12 h-12 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    );
}

