import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import LoadingSpinner from './loadingSpinner';
  
const WhatsAppMessage = () => {
  const { backendURL } = useAuth();
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toDate, setToDate] = useState("");
  const [toTime, setToTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  //function to generate time slots in am/pm format
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
      const response = await axios.get(`${backendURL}/sales`);
      setSales(response.data);
      setFilteredSales(response.data);
    } catch (error) {
      toast.error("Failed to fetch sales data", error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const groupSalesByCustomer = (salesData) => {
    return salesData.reduce((acc, sale) => {
      acc[sale.customerName] = acc[sale.customerName] || [];
      acc[sale.customerName].push(sale);
      return acc;
    }, {});
  };

  //function to convert am/pm to 24hr format for filtering
  const convertTo24HourFormat = (timeStr) => {
    if (!timeStr) return null;
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  //function to filter sales using date
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

      setFilteredSales(filtered);
    }
  }, [sales, fromDate, fromTime, toDate, toTime]);
  
  //function to send whatsapp messages
  const sendWhatsAppMessages = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${backendURL}/sales/send-whatsapp-messages`, {sales: filteredSales,});
      if(response.status === 200) toast.success("Messages sent successfully!");
    } catch (error) {
      toast.error("Failed to send messages: " + error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };  

  const handleRemoveFilters = () => {
    setFromDate("");
    setFromTime("");
    setToDate("");
    setToTime("");
    fetchSales();
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
            {generateTimeSlots()?.map((slot, idx) => <option key={idx} value={slot}>{slot}</option>)}
          </select>
        </div>
        <button className='px-4 py-2 rounded-md bg-red-500 text-white font-medium shadow-md'
          onClick={handleRemoveFilters}>
          Remove Filters
        </button>
        <button onClick={sendWhatsAppMessages}
          className='px-4 py-2 rounded-md bg-green-500 text-white font-medium shadow-md'>
          Send WhatsApp Bills
        </button>
      </div>
      {/* Filters */}
      <div className='w-full h-full bg-white p-3 rounded-lg'>
        {isLoading ? (
          <LoadingSpinner />
        ) : filteredSales.length > 0 ? (
          Object.entries(groupSalesByCustomer(filteredSales)).map(([customerName, sales]) => (
            <div key={customerName} className='border p-4 mb-4'>
              <h2 className='text-lg font-bold'>{customerName}</h2>
              <table className='w-full border-collapse border border-gray-300 mt-2'>
                <thead>
                  <tr className='bg-gray-200'>
                    <th className='border border-gray-300 p-2'>Lot Name</th>
                    <th className='border border-gray-300 p-2'>Kgs</th>
                    <th className='border border-gray-300 p-2'>Price/Kg</th>
                    <th className='border border-gray-300 p-2'>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale, idx) => (
                    <tr key={idx} className='border border-gray-300'>
                      <td className='border border-gray-300 p-2'>{sale.lotName}</td>
                      <td className='border border-gray-300 p-2'>{sale.numberOfKgs}</td>
                      <td className='border border-gray-300 p-2'>{sale.pricePerKg}</td>
                      <td className='border border-gray-300 p-2'>{sale.numberOfKgs * sale.pricePerKg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <p className='text-red-500 font-medium text-xl'>No sales found for the selected range.</p>
        )}
      </div>
    </div>
  );
};
  
export default WhatsAppMessage;
  