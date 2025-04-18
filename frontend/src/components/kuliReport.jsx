import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from './loadingSpinner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const KuliReport = () => {
  const { backendURL } = useAuth();
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toDate, setToDate] = useState('');
  const [toTime, setToTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        let hour = h % 12 || 12;
        let minute = m.toString().padStart(2, "0");
        let ampm = h < 12 ? "AM" : "PM";
        slots.push(`${hour}:${minute} ${ampm}`);
      }
    }
    return slots;
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${backendURL}/sales/kuli`);
      const today = new Date().toISOString().split('T')[0];
      const todaySales = response.data.filter(sale => sale.createdAt.startsWith(today));
      setSales(response.data);
      setFilteredSales(groupByLot(todaySales));
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error("Failed to generate kuli report");
    } finally {
      setIsLoading(false);
    }
  };

  const convertTo24HourFormat = (timeStr) => {
    if (!timeStr) return null;
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (fromDate && fromTime && toDate && toTime) {
      const formattedFromTime = convertTo24HourFormat(fromTime);
      const formattedToTime = convertTo24HourFormat(toTime);
      if (!formattedFromTime || !formattedToTime) return;

      const fromDateTime = new Date(`${fromDate}T${formattedFromTime}:00`);
      const toDateTime = new Date(`${toDate}T${formattedToTime}:00`);

      const filtered = sales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= fromDateTime && saleDate <= toDateTime;
      });

      setFilteredSales(groupByLot(filtered));
    }
  }, [sales, fromDate, fromTime, toDate, toTime]);

  const groupByLot = (salesData) => {
    const groupedData = salesData.reduce((acc, sale) => {
      acc[sale.lotName] = (acc[sale.lotName] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(groupedData).map(lotName => ({
      lotName,
      numberOfBags: groupedData[lotName]
    }));
  };

  const generatePdf = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.text("JVK Vegetable Retail Store", 10, 10);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 8, 20);

    const tableColumn = ["Lot Name", "Number of Bags"];
    const tableRows = filteredSales.map(lot => [
      lot.lotName?.split("-").slice(0,3).join("-") || "N/A",
      lot.numberOfBags || 0
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
      margin: { top: 10 },
    });

    doc.save(`kuli_sales_report_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className='mt-5'>
      {/* Filters */}
      <div className='flex gap-4 mb-4'>
        <div className='flex flex-col gap-1'>
          <label className='text-sm text-gray-600 font-medium'>From Date:</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            className="px-4 py-2 rounded-md text-white font-medium bg-blue-400 shadow-sm focus:outline-none" />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-sm font-medium'>From Time:</label>
          <select value={fromTime} onChange={(e) => setFromTime(e.target.value)} className="px-4 py-2 rounded-md bg-blue-400 text-white">
            <option value="">From time</option>
            {generateTimeSlots().map((slot, idx) => <option key={idx} value={slot}>{slot}</option>)}
          </select>
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-sm text-gray-600 font-medium'>To Date:</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            className="px-4 py-2 rounded-md text-white font-medium bg-blue-400 shadow-sm focus:outline-none" />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-sm font-medium'>To Time:</label>
          <select value={toTime} onChange={(e) => setToTime(e.target.value)} className="px-4 py-2 rounded-md bg-blue-400 text-white">
            <option value="">To time</option>
            {generateTimeSlots().map((slot, idx) => <option key={idx} value={slot}>{slot}</option>)}
          </select>
        </div>
        <button className='px-4 py-2 rounded-md bg-green-500 text-white   font-medium shadow-md'
          onClick={generatePdf}>
          Download PDF
        </button>
      </div>
      {/* Filters */}
      <div className='w-full h-full bg-white p-3 rounded-lg'>
        {isLoading ? (
          <LoadingSpinner />
        ) : filteredSales.length > 0 ? (
          <table className='w-full border-collapse border border-gray-300'>
            <thead>
              <tr className='bg-gray-200'>
                <th className='border border-gray-300 p-2'>Lot Name</th>
                <th className='border border-gray-300 p-2'>Number of Bags</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((lot, idx) => (
                <tr key={idx} className='border border-gray-300'>
                  <td className='border border-gray-300 p-2'>{lot.lotName}</td>
                  <td className='border border-gray-300 p-2'>{lot.numberOfBags}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className='text-red-500 font-medium text-xl'>No sales found for the selected range.</p>
        )}
      </div>
    </div>
  );
};

export default KuliReport;