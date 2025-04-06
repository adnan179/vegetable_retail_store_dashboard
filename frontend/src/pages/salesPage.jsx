import React, {useState, useEffect, useMemo } from 'react'
import axios from "axios";
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/loadingSpinner';
import AddSalesForm from '../components/addSalesForm';
import { useAuth } from '../context/AuthContext';
import DeletedSales from '../components/deletedSales';
import SalesHistory from '../components/salesHistory';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

const SalesPage = () => {
  const { backendURL, user} = useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sales,setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [lots, setLots] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedLot, setSelectedLot] = useState("");
  const [selectedAmount, setSelectedAmount] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fromTime, setFromTime] = useState(""); // Default start time
  const [toTime, setToTime] = useState(""); // Default end time
  const [totalSalesTillDate, setTotalSalesTillDate] = useState(0);
  const [totalSalesToday, setTotalSalesToday] = useState(0);
  const [totalSalesFilteredAmount, setTotalSalesFilteredAmount] = useState(0);
  const [isDeletedData, setIsDeletedData] = useState(false);
  const [isHistoryData, setIsHistoryData] = useState(false);

  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) { // Increment by 30 minutes
        let hour = h % 12 || 12; // Convert 0 hour to 12
        let minute = m.toString().padStart(2, "0");
        let ampm = h < 12 ? "AM" : "PM";
        slots.push(`${hour}:${minute} ${ampm}`);
      }
    }
    return slots;
  };

  useEffect(() =>{
    fetchSales();
  },[]);

  //function to fetch all sales
  const fetchSales = async () => {
    setIsLoading(true);
  
    try {
      const response = await axios.get(`${backendURL}/sales`);
      if (response.status === 200) {
        const data = response.data;
        setSales(data);
        setFilteredSales(data);
        setError("");
  
        const uniqueCustomers = [...new Set(data.map((sale) => sale.customerName))].sort((a,b) => a.customerName - b.customerName);
        const uniqueLots = [...new Set(data.map((sale) => sale.lotName))].sort((a,b) => a.lotName - b.lotName);
        setCustomers(uniqueCustomers);
        setLots(uniqueLots);
        const total = data.reduce((sum,current) => {
          return sum + current.totalAmount;
        },0);
        setTotalSalesTillDate(total);

        const totalToday = data
            .filter((sale) => {
              const saleDate = new Date(sale.createdAt).toISOString().split("T")[0]; // Extract YYYY-MM-DD
              const todayDate = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
              return saleDate === todayDate;
            })
            .reduce((acc, sale) => acc + Number(sale.totalAmount), 0);
        setTotalSalesToday(totalToday);
      }
    } catch (err) {
      setError("Error fetching sales data", err);
      console.log("Error fetching sales data", err);
    } finally {
      setIsLoading(false);
    }
  };
  

  //function to send sale data to sale form when clicked on edit button
  const handleEdit = (sale) => {
    setSelectedSale(sale);
    setIsEdit(true);
    setIsFormOpen(true);
  }

  
  //function to filter data
  const filteredData = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      const fromDateTime = fromDate && fromTime ? new Date(`${fromDate} ${fromTime}`) : null;
      const toDateTime = toDate && toTime ? new Date(`${toDate} ${toTime}`) : null;
      return (
        (!selectedCustomer || sale.customerName === selectedCustomer) &&
        (!selectedLot || sale.lotName === selectedLot) &&
        (!selectedPaymentType || sale.paymentType.split("-")[0] === selectedPaymentType) &&
        (!selectedAmount || 
        (sale.totalAmount && sale.totalAmount >= parseInt(selectedAmount.split('-')[0]) && sale.totalAmount <= parseInt(selectedAmount.split('-')[1]))) &&
        (!fromDateTime || saleDate >= fromDateTime) &&
        (!toDateTime || saleDate <= toDateTime)
      );
    });
  }, [sales, selectedCustomer, selectedLot, selectedAmount, selectedPaymentType, fromDate, toDate, fromTime, toTime]);
  
  useEffect(() => {
    setFilteredSales(filteredData);
  }, [filteredData]);
  

  //function to remove filters
  const handleRemoveFilters = () => {
    setSelectedCustomer("");
    setSelectedLot("");
    setSelectedAmount("");
    setFromDate("");
    setToDate("");
    setSelectedPaymentType("");
    setFromTime("");
    setToTime("");
    setTotalSalesFilteredAmount(0)
  };
  //function to delete selected farmer when clicked on delete button
  const handleDelete = async (saleId) => {
    setIsLoading(true);
    try{
      const deletedBy = user.userName;
      const response = await axios.delete(`${backendURL}/sales/${saleId}`, {
        data: { deletedBy }
      });
      if(response.status === 200){
        toast.success("Sale deleted successfully");
        fetchSales();
      }
    }catch(err){
      toast.error(`Error deleting sale: ${err.message}`);
      console.log("Error deleting sale",err);
    }finally{
      setIsLoading(false);
    }
  };

  const generateFilteredSalesAmount = () => {
    if (selectedAmount || selectedCustomer || selectedLot || fromDate || fromTime || toDate || toTime){
      const total = filteredSales.reduce((sum,current) => sum += current.totalAmount,0);
      setTotalSalesFilteredAmount(total);
    }
    
  }
  useEffect(() => {
    generateFilteredSalesAmount();
  },[filteredSales])

  return (
    <section className="flex flex-col w-[100% - 110px] min-h-screen p-5 ml-[100px] overflow-auto">
      {/* sales information */}
      <div className='flex flex-row gap-3'>
        <div className='flex flex-col p-4 rounded-md bg-white shadow'>
          <h3 className='font-medium text-lg'>Total Sales Amount till date</h3>
          <h1 className='text-2xl font-medium text-[#1E90FF]'>{totalSalesTillDate ? totalSalesTillDate : 0}</h1>
        </div>
        <div className='flex flex-col p-4 rounded-md bg-white shadow'>
          <h3 className='font-medium text-lg'>Total Sales Amount Today</h3>
          <h1 className='text-2xl font-medium text-[#1E90FF]'>{totalSalesToday ? totalSalesToday : 0}</h1>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="px-4 py-2 rounded-md bg-green-500 text-lg font-medium text-white shadow-sm">
            Add New Sale
        </button>
        <button onClick={() => setIsHistoryData(!isHistoryData)}
          className="px-4 py-2 rounded-md text-white font-medium bg-blue-500 shadow-sm">
          History
        </button>
        <button onClick={() => setIsDeletedData(!isDeletedData)}
          className="px-4 py-2 rounded-md text-white font-medium bg-red-500 shadow-sm">
          Deleted Sales
        </button>
      </div>
      {/* filters */}
        <div className="flex flex-row gap-5 mt-3">
          <div className='flex flex-col gap-1'>
            <label className='text-sm text-gray-600 font-medium'>
              From Date:
            </label>
            <input 
              type="date" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)} className="px-4 py-2 rounded-md text-white font-medium bg-blue-400 shadow-sm focus:outline-none" 
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>From Time:</label>
            <select value={fromTime} onChange={(e) => setFromTime(e.target.value)} className="px-4 py-2 rounded-md bg-blue-400 text-white">
              <option value="">From time</option>
              {generateTimeSlots().map((slot, idx) => <option key={idx} value={slot}>{slot}</option>)}
            </select>
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-sm text-gray-600 font-medium'>
              To Date:
            </label>
            <input 
              type="date" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)} className="px-4 py-2 rounded-md text-white font-medium bg-blue-400 shadow-sm
              focus:outline-none" 
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>To Time:</label>
            <select value={toTime} onChange={(e) => setToTime(e.target.value)} className="px-4 py-2 rounded-md bg-blue-400 text-white">
              <option value="">To time</option>
              {generateTimeSlots().map((slot, idx) => <option key={idx} value={slot}>{slot}</option>)}
            </select>
          </div>
          <Autocomplete
            className="bg-blue-500 mui-white-text rounded-md w-[150px]"
            options={customers && customers.map(customer => customer)}
            value={selectedCustomer}
            onChange={(event, newValue) => {
              setSelectedCustomer(newValue || '');
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Customer"
                variant="outlined"
                fullWidth
              />
            )}
          />
          <Autocomplete
            className="mui-white-text w-[200px] bg-blue-400 rounded-md"
            options={lots || []}
            getOptionLabel={(lot) => lot.split('-').slice(0, 3).join('-')}
            value={selectedLot}
            onChange={(event, newValue) => setSelectedLot(newValue || '')}
            renderInput={(params) => (
              <TextField {...params} label="Lot names" variant="outlined" fullWidth />
            )}
            
          />
          <select value={selectedPaymentType}
            onChange={(e) => setSelectedPaymentType(e.target.value)}
            className="px-4 py-2 rounded-md text-white font-medium bg-blue-400 shadow-sm focus:outline-none">
              <option value="">Payment Type</option>
              <option value="cash" className='text-green-500 font-medium'>
                cash
              </option>
              <option value="credit" className='text-red-500 font-medium'>
                credit
              </option>
          </select>
          <button 
            onClick={() => {
              handleRemoveFilters();
              }} 
              className="px-4 py-2 rounded-md text-white font-medium bg-red-500 shadow-sm">
              Remove Filters
          </button>
        </div>
        {/* filters */}
        {/* table */}
        <table className="bg-white w-full mt-5 border-separate border border-black rounded-lg">
          <thead>
            <tr className="text-left text-[16px] text-black">
              <th className="border border-black p-2">Customer name</th>
              <th className="border border-black p-2">Lot name</th>
              <th className="border border-black p-2">Number of kgs</th>
              <th className="border border-black pl-2">Price per kg</th>
              <th className="border border-black pl-2">Payment Type</th>
              <th className="border border-black pl-2">Amount</th>
              <th className="border border-black pl-2">Created By</th>
              <th className="border border-black pl-2">Created At</th>
              <th className="border border-black p-2"></th>
              <th className="border border-black p-2"></th>
            </tr>
          </thead>
          {isLoading ? (
            <LoadingSpinner />) : error ? (
              <div className="w-full h-full justify-center items-center">
                <p className="text-red-500 font-medium text-xl">{error}</p>
              </div>
            ):(
              <tbody className="text-[16px]">
                {filteredSales && filteredSales.map((sale) => (
                  <tr key={sale._id} className="text-left">
                    <td className="border border-black p-2 ">{sale.customerName}</td>
                    <td className="border border-black p-2 ">{sale.lotName.split('-').slice(0, 3).join('-')}</td>
                    <td className="border border-black p-2">{sale.numberOfKgs}</td>
                    <td className="border border-black p-2">{sale.pricePerKg}</td>
                    <td className={`${sale.paymentType.split('-')[0] === "credit"? "bg-red-500":"bg-green-500"} border border-black p-2`}>{sale.paymentType.split('-')[0]}</td>
                    <td className={`${sale.paymentType.split('-')[0] === "credit" ? "text-red-500":"text-green-500"} border border-black p-2 font-medium`}>{sale.totalAmount}</td>
                    <td className="border border-black p-2">{sale.createdBy}</td>
                    <td className="border border-black p-2">{new Date(sale.createdAt).toLocaleString()}</td>
                    <td className="border border-black p-2">
                      <button onClick={() => handleEdit(sale)} className="bg-gray-200 text-[#1E90FF] font-bold cursor-pointer px-4 py-2 rounded">
                        Edit
                      </button>
                    </td>
                    <td className="border border-black p-2">
                      <button onClick={() => handleDelete(sale.salesId)} className="bg-gray-200 text-[#FF0000] font-bold cursor-pointer px-4 py-2 rounded">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-semibold">
                  <td className="border border-black p-2">-</td>
                  <td className="border border-black p-2" colSpan={2}>
                    Total number of kgs:
                    <span className='font-bold text-blue-600'>
                    {
                      filteredSales.reduce((sum, sale) => sum + Number(sale.numberOfKgs), 0)
                    }
                    </span>
                    
                  </td>
                  <td className="border border-black p-2" colSpan={2}>
                    Average price per kg:
                    <span className='font-bold text-blue-600'>
                    {
                      (
                        filteredSales.reduce((sum, sale) => sum + Number(sale.pricePerKg), 0) / filteredSales.length
                      ).toFixed(2)
                    }
                    </span>
                    
                  </td>
                  <td className="border border-black p-2" colSpan={2}>
                    Total Amount:
                    <span className='font-bold text-blue-600'>
                    {
                      filteredSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
                    }
                    </span>
                    
                  </td>
                  <td className="border border-black p-2" colSpan={3}>-</td>
                </tr>
              </tbody>
            )} 
        </table>
        {isFormOpen && (
          <div onClick={() => setIsFormOpen(false)} className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
          <AddSalesForm
            onClose={() => setIsFormOpen(false)}
            fetchSales={fetchSales}
            sale={selectedSale}
            isEdit={isEdit}
            onCloseEdit={() => setIsEdit(false)}
          />
        </div>
        )}
        {isDeletedData && (
          <div onClick={() => setIsDeletedData(false)} className='fixed inset-0 flex justify-center items-center bg-black/50 z-50'>
            <DeletedSales onClose={() => setIsDeletedData(false)}/>
          </div>
        )}
        {isHistoryData && (
          <div onClick={() => setIsHistoryData(false)} className='fixed inset-0 flex justify-center items-center bg-black/50 z-50'>
            <div onClick={(e) => e.stopPropagation()} className='w-3/4 max-w-2xl h-3/4 bg-white rounded-lg shadow-lg overflow-hidden'>
              <div className='h-full overflow-y-auto p-6'>
                <SalesHistory onClose={() => setIsHistoryData(false)}/>
              </div>
            </div>
          </div>
        )}
    </section>
  )
}

export default SalesPage;