"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function AddFundsPage() {
    const [formData, setFormData] = useState({
        amount: "",
        payerName: "",
        payerEmail: "",
        payerMobile: "",
    });
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ type: "info" | "error" | "success"; message: string } | null>(null);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setAlert(null);

        try {
            // Validate fields
            if (!formData.amount || !formData.payerName || !formData.payerEmail || !formData.payerMobile) {
                setAlert({ type: "error", message: "All fields are required" });
                setLoading(false);
                return;
            }

            // Validate amount
            const amount = parseFloat(formData.amount);
            if (isNaN(amount) || amount <= 0) {
                setAlert({ type: "error", message: "Please enter a valid amount" });
                setLoading(false);
                return;
            }

            // Validate mobile number (Indian format: 10 digits starting with 6-9)
            if (!/^[6-9]\d{9}$/.test(formData.payerMobile)) {
                setAlert({ type: "error", message: "Please enter a valid 10-digit mobile number" });
                setLoading(false);
                return;
            }

            // Validate email
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.payerEmail)) {
                setAlert({ type: "error", message: "Please enter a valid email address" });
                setLoading(false);
                return;
            }

            // Call API to initiate payment
            const response = await fetch("/api/sabpaisa/initiate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: amount.toFixed(2),
                    payerName: formData.payerName.trim(),
                    payerEmail: formData.payerEmail.trim(),
                    payerMobile: formData.payerMobile.trim(),
                    utilityId: "education",
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Payment initiation failed");
            }

            // Create a form and submit to SabPaisa
            const { encData, clientCode, paymentUrl } = result.data;

            const form = document.createElement("form");
            form.method = "POST";
            form.action = paymentUrl;

            const encDataInput = document.createElement("input");
            encDataInput.type = "hidden";
            encDataInput.name = "encData";
            encDataInput.value = encData;
            form.appendChild(encDataInput);

            const clientCodeInput = document.createElement("input");
            clientCodeInput.type = "hidden";
            clientCodeInput.name = "clientCode";
            clientCodeInput.value = clientCode;
            form.appendChild(clientCodeInput);

            document.body.appendChild(form);
            form.submit();

        } catch (error: any) {
            console.error("Payment error:", error);
            setAlert({ type: "error", message: error.message || "Payment initiation failed. Please try again." });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-lightBg to-white py-12">
            <div className="max-w-2xl mx-auto px-4">
                {/* Breadcrumb */}
                <nav className="text-sm text-gray-500 mb-6">
                    <Link href="/" className="hover:text-primary">Home</Link>
                    <span className="px-2">/</span>
                    <span className="text-gray-700">Add Funds</span>
                </nav>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        Add Funds to Your Account
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Quick and secure payment with SabPaisa
                    </p>
                </div>

                {/* Alert */}
                {alert && (
                    <div className={`${alert.type === "error"
                            ? "bg-red-100 border-red-400 text-red-700"
                            : alert.type === "success"
                                ? "bg-green-100 border-green-400 text-green-700"
                                : "bg-blue-100 border-blue-400 text-blue-700"
                        } border px-4 py-3 rounded-lg mb-6 flex items-center`}>
                        <i className={`fas ${alert.type === "error" ? "fa-exclamation-circle" :
                                alert.type === "success" ? "fa-check-circle" :
                                    "fa-info-circle"
                            } mr-3`}></i>
                        {alert.message}
                    </div>
                )}

                {/* Payment Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Amount */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                                Amount <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">₹</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/70 shadow-sm text-lg"
                                    disabled={loading}
                                    required
                                />
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Enter the amount you want to add</p>
                        </div>

                        {/* Payer Name */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.payerName}
                                onChange={(e) => setFormData({ ...formData, payerName: e.target.value })}
                                placeholder="Enter your full name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/70 shadow-sm"
                                disabled={loading}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={formData.payerEmail}
                                onChange={(e) => setFormData({ ...formData, payerEmail: e.target.value })}
                                placeholder="your.email@example.com"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/70 shadow-sm"
                                disabled={loading}
                                required
                            />
                            <p className="text-sm text-gray-500 mt-1">Payment receipt will be sent to this email</p>
                        </div>

                        {/* Mobile Number */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                                Mobile Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.payerMobile}
                                onChange={(e) => setFormData({ ...formData, payerMobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                                placeholder="10-digit mobile number"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/70 shadow-sm"
                                disabled={loading}
                                maxLength={10}
                                required
                            />
                            <p className="text-sm text-gray-500 mt-1">Enter your 10-digit mobile number</p>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-secondary to-primary text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-primary hover:to-secondary transition duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner border-4 border-white border-t-transparent rounded-full w-6 h-6 animate-spin mr-3" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-lock mr-2"></i>
                                        Proceed to Payment
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Security Info */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center">
                                <i className="fas fa-shield-alt text-green-600 mr-2"></i>
                                <span>Secure Payment</span>
                            </div>
                            <div className="flex items-center">
                                <i className="fas fa-lock text-green-600 mr-2"></i>
                                <span>256-bit Encryption</span>
                            </div>
                            <div className="flex items-center">
                                <i className="fas fa-check-circle text-green-600 mr-2"></i>
                                <span>SabPaisa Gateway</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="bg-white rounded-lg p-4 shadow-md text-center border border-gray-200">
                        <i className="fas fa-bolt text-accent text-2xl mb-2"></i>
                        <p className="text-sm font-semibold text-gray-700">Instant Processing</p>
                        <p className="text-xs text-gray-500 mt-1">Funds added immediately</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-md text-center border border-gray-200">
                        <i className="fas fa-mobile-alt text-accent text-2xl mb-2"></i>
                        <p className="text-sm font-semibold text-gray-700">All Payment Methods</p>
                        <p className="text-xs text-gray-500 mt-1">UPI, Cards, Net Banking</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-md text-center border border-gray-200">
                        <i className="fas fa-receipt text-accent text-2xl mb-2"></i>
                        <p className="text-sm font-semibold text-gray-700">Instant Receipt</p>
                        <p className="text-xs text-gray-500 mt-1">Email confirmation sent</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

