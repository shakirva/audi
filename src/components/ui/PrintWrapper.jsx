import React, { forwardRef } from 'react';
import { useRole } from '../../context/RoleContext';

const PrintWrapper = forwardRef(({ children, title, subtitle }, ref) => {
  const { tenant } = useRole();

  return (
    <div className="hidden print:block print:bg-white print:text-black">
      <div ref={ref} className="print-page">
        {/* Print Header */}
        <div className="border-b-2 border-gray-900 pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-serif font-black uppercase tracking-tight text-gray-900">
              {tenant?.name || "Venueza Auditorium"}
            </h1>
            <p className="text-sm font-medium text-gray-600 mt-1">
              123 Business Avenue, Kerala, India • GSTIN: 32ABCDE1234F1Z5
            </p>
            <p className="text-sm font-medium text-gray-600">
              +91 98765 43210 • hello@venueza.com
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-widest text-gray-800">{title}</h2>
            {subtitle && <p className="text-sm font-bold text-gray-500 mt-1">{subtitle}</p>}
            <p className="text-xs font-bold text-gray-400 mt-2">
              Printed: {new Date().toLocaleString()}
            </p>
          </div>
        </div>

        {/* Print Content */}
        <div className="print-content">
          {children}
        </div>

        {/* Print Footer */}
        <div className="fixed bottom-0 left-0 w-full pt-4 border-t border-gray-200 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
          Powered by Venueza ERP • Page 1 of 1
        </div>
      </div>

      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .print-page { min-height: 297mm; position: relative; }
          .print-content { padding-bottom: 20mm; }
          /* Hide non-printable elements */
          .no-print { display: none !important; }
        `}
      </style>
    </div>
  );
});

export default PrintWrapper;
