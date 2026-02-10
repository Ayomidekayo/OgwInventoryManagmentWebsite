import React from "react";
import { motion } from "framer-motion";

const ReturnDetails = ({ returnRecord, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg"
      >
        <h2 className="text-xl font-bold mb-4">Return Details</h2>

        <div className="space-y-2 text-gray-800">
          <p>
            <span className="font-semibold">Item:</span> {returnRecord.item?.name}
          </p>
          <p>
            <span className="font-semibold">Returned By:</span> {returnRecord.returnedBy}
          </p>
          {returnRecord.returnedByEmail && (
            <p>
              <span className="font-semibold">Email:</span> {returnRecord.returnedByEmail}
            </p>
          )}
          <p>
            <span className="font-semibold">Quantity Returned:</span> {returnRecord.quantityReturned}
          </p>
          <p>
            <span className="font-semibold">Condition:</span> {returnRecord.condition}
          </p>
          <p>
            <span className="font-semibold">Remarks:</span> {returnRecord.remarks || "None"}
          </p>
          <p>
            <span className="font-semibold">Processed By:</span> {returnRecord.processedBy?.name || "-"}
          </p>
          <p>
            <span className="font-semibold">Returned On:</span> {new Date(returnRecord.dateReturned).toLocaleString()}
          </p>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReturnDetails;
