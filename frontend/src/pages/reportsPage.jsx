import React, { useState } from 'react'
import KuliReport from '../components/kuliReport';
import SalesReport from '../components/salesReport';
import WhatsAppMessage from '../components/whatsAppMessages';

const ReportsPage = () => {
  const [isKuliReport, setIsKuliReport] = useState(false);
  const [isSalesReport, setIsSalesReport] = useState(false);
  const [isWhatsappReport, setIsWhatsappReport] = useState(false);
 
  const handleKuliReport = (e) => {
    setIsKuliReport(prev => !prev);
    setIsSalesReport(false);
    setIsWhatsappReport(false);
  }

  const handleSalesReport = (e) => {
    setIsSalesReport(prev =>!prev);
    setIsKuliReport(false);
    setIsWhatsappReport(false);
  };

  const handleWhatsappReport = (e) => {
    setIsWhatsappReport(prev => !prev);
    setIsKuliReport(false);
    setIsSalesReport(false);
  };
  return (
    <div className='ml-[110px] w-[100%-110px] min-h-screen p-5'>
      <div className='flex flex-row gap-4'>
        <button onClick={handleKuliReport} className='p-4 rounded-md bg-blue-600 text-white font-medium'>
          Generate Kuli Report
        </button>
        <button onClick={handleSalesReport} className='p-4 rounded-md bg-blue-500 text-white font-medium'>
          Generate Sales Report
        </button>
        <button onClick={handleWhatsappReport} className='p-4 rounded-md bg-green-500 text-white font-medium'>
          Generate WhatsApp Messages
        </button>
      </div>
      {isKuliReport && (
        <div className='w-full h-full'>
          <KuliReport />
        </div>
      )}
      {isSalesReport && (
        <div className='w-full h-full'>
          <SalesReport />
        </div>
      )}
      {isWhatsappReport && (
        <div className='w-full h-full'>
          <WhatsAppMessage/>
        </div>
      )}
    </div>
  )
}

export default ReportsPage