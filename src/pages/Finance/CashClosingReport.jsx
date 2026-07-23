import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { PageLayout, MetricGrid, MetricCard, ContentContainer, Button, formatCurrency } from "../../components/ui/VDS";
import PrintWrapper from "../../components/ui/PrintWrapper";
import { Lock, Calculator, CheckCircle, Printer } from "lucide-react";

const fetchCashClosing = async () => {
  const token = localStorage.getItem("hm_token");
  const res = await axios.get("http://localhost:3000/api/v1/finance/reports/cash-closing", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data;
};

export default function CashClosingReport() {
  const { data, isLoading } = useQuery({
    queryKey: ["cashClosingReport"],
    queryFn: fetchCashClosing,
  });

  if (isLoading) {
    return <div className="p-12 animate-pulse bg-gray-50 min-h-screen"></div>;
  }

  const {
    openingCash, cashReceived, cashPaid, refunds, closingCash, expectedClosing, difference, closedBy, closingTime
  } = data || {};

    const printRef = React.useRef();

  return (
    <>
    <PageLayout 
      title="Cash Closing Report"
      breadcrumbs={[{label: "Reports"}, {label: "Cash Closing", active: true}]}
      actions={
        <>
          <Button variant="secondary" icon={<Printer size={16} />} onClick={() => window.print()}>Print / Save PDF</Button>
          <Button variant="primary" icon={<Lock size={16} />}>Mark Day Closed</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
        
        {/* Left Col: The Math */}
        <div className="lg:col-span-2 space-y-8">
          <ContentContainer className="p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Calculator size={200} /></div>
            
            <h2 className="text-2xl font-bold font-serif mb-8 text-gray-900 border-b border-gray-100 pb-4">Daily Reconciliation</h2>
            
            <div className="space-y-6 max-w-lg relative z-10">
              <div className="flex justify-between items-center text-lg">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Opening Cash</span>
                <span className="font-mono font-bold text-gray-900">{formatCurrency(openingCash)}</span>
              </div>
              
              <div className="flex justify-between items-center text-lg">
                <span className="text-green-600 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                  <span className="text-xl">+</span> Cash Received
                </span>
                <span className="font-mono font-bold text-green-600">{formatCurrency(cashReceived)}</span>
              </div>

              <div className="flex justify-between items-center text-lg">
                <span className="text-red-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                  <span className="text-xl">-</span> Cash Paid (Expenses)
                </span>
                <span className="font-mono font-bold text-red-500">{formatCurrency(cashPaid)}</span>
              </div>

              <div className="flex justify-between items-center text-lg">
                <span className="text-orange-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                  <span className="text-xl">-</span> Refunds
                </span>
                <span className="font-mono font-bold text-orange-500">{formatCurrency(refunds)}</span>
              </div>

              <div className="pt-6 border-t-2 border-gray-900 flex justify-between items-center">
                <span className="text-gray-900 font-black uppercase tracking-widest text-sm">Expected Closing Cash</span>
                <span className="font-mono font-black text-3xl text-gray-900">{formatCurrency(expectedClosing)}</span>
              </div>
            </div>
          </ContentContainer>
        </div>

        {/* Right Col: Summary & Actions */}
        <div className="space-y-8">
          <ContentContainer className="p-8 bg-gray-900 text-white">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Actual Count</h3>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Declared Physical Cash</p>
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <span className="font-mono font-black text-3xl text-white">{formatCurrency(closingCash)}</span>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-800">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Difference</p>
                <span className={`font-mono font-black text-2xl ${difference === 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {difference === 0 ? "Perfect Match" : formatCurrency(difference)}
                </span>
              </div>
            </div>
          </ContentContainer>

          <ContentContainer className="p-8 bg-green-50 border-green-100">
            <div className="flex items-center gap-4 mb-4">
              <CheckCircle className="text-green-600" size={32} />
              <div>
                <h3 className="text-lg font-bold text-green-900">Ready to Close</h3>
                <p className="text-sm font-bold text-green-700 mt-1">Registers are balanced.</p>
              </div>
            </div>
            <div className="text-sm font-bold text-green-800/70 mt-6 pt-4 border-t border-green-200">
              <p>Prepared By: {closedBy}</p>
              <p>Time: {new Date(closingTime).toLocaleTimeString()}</p>
            </div>
          </ContentContainer>
        </div>

      </div>
    </PageLayout>

    {/* Hidden Print Wrapper */}
    <PrintWrapper ref={printRef} title="Cash Closing Report" subtitle={`Date: ${new Date().toLocaleDateString()}`}>
      <div className="grid grid-cols-2 gap-8 mt-8">
        <div className="space-y-4">
          <div className="flex justify-between font-bold text-lg border-b border-gray-200 pb-2">
            <span>Opening Cash</span>
            <span>{formatCurrency(openingCash)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-b border-gray-200 pb-2 text-green-700">
            <span>(+) Cash Received</span>
            <span>{formatCurrency(cashReceived)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-b border-gray-200 pb-2 text-red-700">
            <span>(-) Cash Paid (Expenses)</span>
            <span>{formatCurrency(cashPaid)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-b border-gray-200 pb-2 text-orange-700">
            <span>(-) Refunds</span>
            <span>{formatCurrency(refunds)}</span>
          </div>
          <div className="flex justify-between font-black text-xl border-t-4 border-gray-900 pt-4 mt-4">
            <span>Expected Closing Cash</span>
            <span>{formatCurrency(expectedClosing)}</span>
          </div>
        </div>

        <div className="space-y-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div>
            <p className="text-sm font-bold uppercase text-gray-500">Declared Physical Cash</p>
            <p className="font-mono text-3xl font-black text-gray-900">{formatCurrency(closingCash)}</p>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-bold uppercase text-gray-500">Difference</p>
            <p className={`font-mono text-2xl font-black ${difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {difference === 0 ? "Perfect Match" : formatCurrency(difference)}
            </p>
          </div>
          <div className="pt-12 mt-12 border-t border-dashed border-gray-400 flex justify-between items-end">
             <div>
               <p className="text-sm font-bold text-gray-900">Prepared By:</p>
               <p className="text-sm text-gray-600">{closedBy}</p>
             </div>
             <div>
               <p className="text-sm font-bold text-gray-900">Signature:</p>
               <div className="w-40 border-b border-gray-400 mt-8"></div>
             </div>
          </div>
        </div>
      </div>
    </PrintWrapper>
    </>
  );
}
