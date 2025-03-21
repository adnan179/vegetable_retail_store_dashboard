import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import LoadingSpinner from './loadingSpinner';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

const SalesReport = () => {
  const { backendURL } = useAuth();
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState({});
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
      const data = response.data;
      setSales(data);
      setFilteredSales(groupSalesByLot(data));
    } catch (error) {
      toast.error("Failed to fetch sales data", error.message);
      console.error("Failed to fetch sales data", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const groupSalesByLot = (sales) => {
    return sales.reduce((acc, sale) => {
      if (!acc[sale.lotName]) {
        acc[sale.lotName] = { sales: [], totalKgs: 0, totalAmount: 0 };
      }
      acc[sale.lotName].sales.push(sale);
      acc[sale.lotName].totalKgs += parseFloat(sale.numberOfKgs) || 0;
      acc[sale.lotName].totalAmount += parseFloat(sale.totalAmount) || 0;
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

      setFilteredSales(groupSalesByLot(filtered));
    }
  }, [sales, fromDate, fromTime, toDate, toTime]);

  const handleRemoveFilters = () => {
    setFromDate("");
    setFromTime("");
    setToDate("");
    setToTime("");
    fetchSales();
  };

  const styles = StyleSheet.create({
    page: { padding: 20 },
    section: { marginBottom: 10 },
    title: { fontSize: 10, fontWeight: 'bold', marginBottom: 15 },
    reportDate: { fontSize: 8, marginBottom: 15 },
    tableHeader: { flexDirection: 'row', borderBottom: 1, paddingBottom: 5, fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', borderBottom: 0.5, paddingVertical: 2 },
    cell: { flex: 1, fontSize: 10, padding: 2 }
  });

  const SalesReportPDF = ({ sales }) => {
    const groupedSales = groupSalesByLot(sales);
    return(
      <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>JVK Vegetable Retail Store</Text>
        <Text style={styles.reportDate}>Report Date: {new Date().toLocaleDateString()}</Text>
        {Object.entries(groupedSales).map(([lotName, { sales, totalKgs, totalAmount }]) => (
            <View key={lotName} style={styles.section}>
              <Text style={styles.title}>Lot Name: {lotName?.split("-").slice(0,3).join("-")}</Text>
              <View style={styles.tableHeader}>
                <Text style={styles.cell}>Customer</Text>
                <Text style={styles.cell}>Kgs</Text>
                <Text style={styles.cell}>Price/Kg</Text>
                <Text style={styles.cell}>Total</Text>
                <Text style={styles.cell}>Payment</Text>
                <Text style={styles.cell}>Date</Text>
              </View>
              {sales.map((sale, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.cell}>{sale.customerName}</Text>
                  <Text style={styles.cell}>{sale.numberOfKgs}</Text>
                  <Text style={styles.cell}>{sale.pricePerKg}</Text>
                  <Text style={styles.cell}>{sale.totalAmount}</Text>
                  <Text style={styles.cell}>{sale.paymentType}</Text>
                  <Text style={styles.cell}>{new Date(sale.createdAt).toLocaleString()}</Text>
                </View>
              ))}
              <Text style={styles.title}>Total Kgs: {totalKgs.toFixed(2)}</Text>
              <Text style={styles.title}>Total Amount: {totalAmount.toFixed(2)}</Text>
            </View>
          ))}
      </Page>
    </Document>
    )
  };

  //function to handle download pdf
  const handleDownloadPDF = async () => {
    const salesArray = Object.entries(filteredSales).flatMap(([lotName, { sales }]) => sales);
    const blob = await pdf(<SalesReportPDF sales={salesArray} />).toBlob();
    saveAs(blob, `sales_report_${new Date().toLocaleDateString()}.pdf`);
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
        <button className='px-4 py-2 rounded-md bg-red-500 text-white   font-medium shadow-md'
          onClick={handleRemoveFilters}>
          Remove Filters
        </button>
        <button className='px-4 py-2 rounded-md bg-green-500 text-white   font-medium shadow-md'
          onClick={() => handleDownloadPDF()}>
          Download PDF
        </button>
      </div>
      {/* Filters */}
      <div className='w-full h-full bg-white p-3 rounded-lg'>
        {isLoading ? (
          <LoadingSpinner />
        ) : Object.keys(filteredSales).length > 0 ? (
          Object.entries(filteredSales)?.map(([lotName, {sales, totalKgs, totalAmount}]) => (
            <div key={lotName} className='border p-4 mb-4'>
              <h2 className='text-lg font-bold'>{lotName?.split("-").slice(0,3).join("-")}</h2>
              <table className='w-full border-collapse border border-gray-300 mt-2'>
                <thead>
                  <tr className='bg-gray-200'>
                    <th className='border border-gray-300 p-2'>Customer Name</th>
                    <th className='border border-gray-300 p-2'>Kgs</th>
                    <th className='border border-gray-300 p-2'>Price/Kg</th>
                    <th className='border border-gray-300 p-2'>Total</th>
                    <th className='border border-gray-300 p-2'>Payment Type</th>
                    <th className='border border-gray-300 p-2'>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale, idx) => (
                    <tr key={idx} className='border border-gray-300'>
                      <td className='border border-gray-300 p-2'>{sale.customerName}</td>
                      <td className='border border-gray-300 p-2'>{sale.numberOfKgs}</td>
                      <td className='border border-gray-300 p-2'>{sale.pricePerKg}</td>
                      <td className='border border-gray-300 p-2'>{sale.totalAmount}</td>
                      <td className='border border-gray-300 p-2'>{sale.paymentType}</td>
                      <td className='border border-gray-300 p-2'>{new Date(sale.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className='font-semibold'>Total Kgs: {totalKgs.toFixed(2)}</p>
              <p className='font-semibold'>Total Amount: {totalAmount.toFixed(2)}</p>
            </div>
          ))
        ) : (
          <p className='text-red-500 font-medium text-xl'>No sales found for the selected range.</p>
        )}
      </div>
    </div>
  );
};

export default SalesReport;
