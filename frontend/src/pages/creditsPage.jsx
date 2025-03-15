import React, {useState, useEffect, useMemo, useRef } from 'react'
import axios from "axios";
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/loadingSpinner';
import EditCreditForm from '../components/editCreditForm';
import { useAuth } from '../context/AuthContext';
import CreditsHistory from '../components/creditHistory';

const CreditsPage = () => {
  const { backendURL } = useAuth();
  const inputRef = useRef(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [credits,setCredits] = useState([]);
  const [filteredCredits, setFilteredCredits] = useState([]);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedAmount, setSelectedAmount] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fromTime, setFromTime] = useState("00:00 AM"); // Default start time
  const [toTime, setToTime] = useState("11:59 PM"); // Default end time
  const [totalCreditsTillDate, setTotalCreditsTillDate] = useState(0);
  const [totalCreditsToday, setTotalCreditsToday] = useState(0);
  const [isHistoryData, setIsHistoryData] = useState(false);
  const amountRanges = [
    "0-10000", "11000-20000","21000-30000","31000-40000","41000-50000","51000-60000","61000-70000","71000-80000","81000-90000","91000-100000"];

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
  //function to focus on the first input field in the form
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

  useEffect(() =>{
    fetchCredits();
  },[]);

  //function to fetch all credits
  const fetchCredits = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${backendURL}/credits`);
        if (response.status === 200) {
          let data = response.data;
          setCredits(data);
          setFilteredCredits(data);

          const uniqueCustomers = [...new Set(data.map((sale) => sale.customerName))];
          setCustomers(uniqueCustomers);
          const total = data.reduce((sum, current) => {
            return sum + current.creditAmount;
          }, 0);
          setTotalCreditsTillDate(total);
  
          const totalToday = data
            .filter((credit) => {
              const creditDate = new Date(credit.createdAt).toISOString().split("T")[0]; // Extract YYYY-MM-DD
              const todayDate = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
              return creditDate === todayDate;
            })
            .reduce((acc, credit) => acc + Number(credit.creditAmount), 0);

          setTotalCreditsToday(totalToday);
        }
    } catch (err) {
        setError("Error fetching Credits", err);
        console.log("Error fetching Credits", err);
    } finally {
        setIsLoading(false);
    }
  };
  

  //function to send sale data to sale form when clicked on edit button
  const handleEdit = (credit) => {
    setSelectedCredit(credit);
    setIsFormOpen(true);
    setIsEdit(true)
  };

  
  //function to filter data based on selected farmer, vegetable and paymentStatus
  const filteredData = useMemo(() => { 
    return credits.filter(credit => {
      const creditDate = new Date(credit.createdAt);
      const fromDateTime = fromDate && fromTime ? new Date(`${fromDate} ${fromTime}`) : null;
      const toDateTime = toDate && toTime ? new Date(`${toDate} ${toTime}`) : null;
      return (
        (!selectedCustomer || credit.customerName === selectedCustomer) &&
        (!selectedPayment || (credit.payment === selectedPayment)) &&
        (!selectedAmount || (credit.creditAmount && credit.creditAmount >= parseInt(selectedAmount.split('-')[0]) && credit.creditAmount <= parseInt(selectedAmount.split('-')[1]))) &&
        (!fromDateTime || creditDate >= fromDateTime) &&
        (!toDateTime || creditDate <= toDateTime)
      );
    });
  }, [credits, selectedCustomer,selectedAmount,fromDate, toDate,fromTime,toTime, selectedPayment]);
  
  
  useEffect(() => {
    setFilteredCredits(filteredData);
  }, [filteredData]);
  

  //function to remove filters
  const handleRemoveFilters = () => {
    setSelectedCustomer("");
    setSelectedAmount("");
    setFromDate("");
    setToDate("");
    setSelectedPayment("");
  };
  //function to delete selected farmer when clicked on delete button
  const handleDelete = async (creditId) => {
    setIsLoading(true);
    try{
      const response = await axios.delete(`${backendURL}/credits/${creditId}`);
      if(response.status === 200){
        toast.success("Credit deleted successfully");
        fetchCredits();
      }
    }catch(err){
      toast.error(`Error deleting credit: ${err.message}`);
      console.log("Error deleting credit",err);
    }finally{
      setIsLoading(false);
    }
  }

  return (
    <section className="flex flex-col w-[100% - 110px] min-h-screen p-5 ml-[100px] overflow-auto">
      {/* sales information */}
      <div className='flex flex-row gap-3'>
        <div className='flex flex-col p-2 rounded-md bg-white shadow'>
          <h3 className='font-medium text-sm'>Total Jamalu Amount</h3>
          <h1 className='text-xl font-medium text-[#FF0000]'>{totalCreditsTillDate ? totalCreditsTillDate : 0}</h1>
        </div>
        <div className='flex flex-col p-2 rounded-md bg-white shadow'>
          <h3 className='font-medium text-sm'>Today Jamalu Amount</h3>
          <h1 className='text-xl font-medium text-[#FF0000]'>{totalCreditsToday ? totalCreditsToday : 0}</h1>
        </div>
        <button onClick={() => setIsFormOpen(true)}
        className='px-4 py-2 bg-green-500 rounded-md text-white font-medium text-lg'>Pay Jamalu</button>
        <button onClick={() => setIsHistoryData(!isHistoryData)}
          className="px-4 py-2 rounded-md text-white font-medium bg-blue-500 shadow-sm">
          History
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
              onChange={(e) => setFromDate(e.target.value)} className="px-4 py-2 rounded-md text-white font-medium bg-blue-400 shadow-sm" 
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
              onChange={(e) => setToDate(e.target.value)} className="px-4 py-2 rounded-md text-white font-medium bg-blue-400 shadow-sm" 
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>To Time:</label>
            <select value={toTime} onChange={(e) => setToTime(e.target.value)} className="px-4 py-2 rounded-md bg-blue-400 text-white">
              <option value="">To time</option>
              {generateTimeSlots().map((slot, idx) => <option key={idx} value={slot}>{slot}</option>)}
            </select>
          </div>
            
          <select value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="px-4 py-2 rounded-md text-white font-medium bg-blue-400 shadow-sm">
              <option value="">Customers</option>
              {customers && customers.map((customer,idx) => (
                <option key={idx} value={customer}>
                  {customer}
                </option>
              ))}
          </select>
          <select value={selectedAmount}
            onChange={(e) => setSelectedAmount(e.target.value)}
            className="px-4 py-2 rounded-md text-white font-medium bg-blue-400 shadow-sm">
              <option value="">Amount</option>
              {amountRanges && amountRanges.map((amountRange,idx) => (
                <option key={idx} value={amountRange}>
                  {amountRange}
                </option>
              ))}
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
            <th className="border border-black pl-2">Amount</th>
            <th className="border border-black pl-2">Less</th>
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
                {filteredCredits && filteredCredits.map((credit) => (
                  <tr key={credit._id} className="text-left">
                    <td className="border border-black p-2 ">{credit.customerName}</td>
                    <td className="border border-black p-2 text-[#FF0000]">{credit.creditAmount}</td>
                    <td className="border border-black p-2">{credit.less}</td>
                    <td className="border border-black p-2">{credit.createdBy}</td>
                    <td className="border border-black p-2">{new Date(credit.createdAt).toLocaleString()}</td>
                    <td className="border border-black p-2">
                        <button onClick={() => handleEdit(credit)} className="bg-gray-200 text-[#1E90FF] font-bold cursor-pointer px-4 py-2 rounded">
                            Edit
                        </button>
                    </td>
                    <td className="border border-black p-2">
                        <button onClick={() => handleDelete(credit.creditId)} className="bg-gray-200 text-[#FF0000] font-bold cursor-pointer px-4 py-2 rounded">
                            Delete
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )} 
        </table>
        {isFormOpen && (
          <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
          <EditCreditForm
          isEdit={isEdit}
            onClose={() => setIsFormOpen(false)}
            onCloseEdit={() => {
              setSelectedCredit(null)
              setIsFormOpen(false)
            }}
            fetchCredits={fetchCredits}
            credit={selectedCredit}
          />
        </div>
        )}
        {isHistoryData && (
          <div className='fixed inset-0 flex justify-center items-center bg-black/50 z-50'>
            <div className='w-3/4 max-w-2xl h-3/4 bg-white rounded-lg shadow-lg overflow-hidden'>
              <div className='h-full overflow-y-auto p-6'>
                <CreditsHistory onClose={() => setIsHistoryData(false)}/>
              </div>
            </div>
          </div>
        )}
    </section>
  )
}

export default CreditsPage;