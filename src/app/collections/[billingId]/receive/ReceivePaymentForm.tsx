"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { FiSave, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { processPaymentAction } from "@/app/actions/collectionActions";

export default function ReceivePaymentForm({ billingId, netAmountDue, balance, billingNumber }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    formData.append("billingId", billingId);

    const amountPaid = parseFloat(formData.get("amountPaid") as string);
    if (amountPaid > balance + 0.01) {
      toast.error("Payment cannot exceed the outstanding balance.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await processPaymentAction(formData);
      if (res.success) {
        toast.success("Payment recorded successfully!");
        setTimeout(() => window.location.href = "/collections", 1500);
      } else {
        toast.error(res.error || "Failed to record payment");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Payment Details for {billingNumber}</h2>
          <p className="text-sm text-gray-500">Record a partial or full payment.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Remaining Balance</p>
          <p className="text-2xl font-bold text-blue-600">
            {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(balance)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received (PHP) <span className="text-red-500">*</span></label>
            <input 
              type="number" 
              name="amountPaid"
              required
              step="0.01"
              max={balance}
              defaultValue={balance}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              name="paymentDate"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Payment Method Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank / Check Number</label>
            <input 
              type="text" 
              name="bankOrCheckNumber"
              placeholder="e.g. BDO Check #123456"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Ref / Transaction Number</label>
            <input 
              type="text" 
              name="paymentReferenceNumber"
              placeholder="e.g. TXN-987654321"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Tax & Receipt Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Official Receipt (OR) Number</label>
            <input 
              type="text" 
              name="orNumber"
              placeholder="e.g. OR-00123"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Form 2307 (EWT) Certificate Ref</label>
            <input 
              type="text" 
              name="ewtCertificateReference"
              placeholder="e.g. 2307-2023-Q3"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Remarks */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Notes</label>
            <textarea 
              name="remarks"
              rows={3}
              placeholder="Add any additional notes about this payment..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>

        <div className="pt-5 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : (
              <>
                <FiSave className="mr-2 -ml-1 h-5 w-5" />
                Record Payment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
