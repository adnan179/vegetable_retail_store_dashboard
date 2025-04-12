import React, {useState, useEffect, useMemo, useRef } from 'react'
import axios from "axios";
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/loadingSpinner';
import AddLotForm from '../components/addLotForm';
import InputField from '../components/inputField';
import { useAuth } from '../context/AuthContext';
import StockHistory from '../components/stockHistory';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

const StockPage = () => {
  const { user, backendURL } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [stocks,setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [vegetables, setVegetables] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState("");
  const [selectedVegetable, setSelectedVegetable] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");
  const [selectedStockStatus, setSelectedStockStatus] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fromTime, setFromTime] = useState("00:00 AM"); // Default start time
  const [toTime, setToTime] = useState("11:59 PM"); // Default end time
  const [editedPaymentStatus, setEditedPaymentStatus] = useState("");
  const [editedAmount, setEditedAmount] = useState("");
  const [isEditPaymentStatus, setIsEditPaymentStatus] = useState(false);
  const [selectedLotName, setSelectedLotName] = useState(null);
  const inputRef = useRef(null);
  const [isHistory, setIsHistory] = useState(false);

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
    }, [isEditPaymentStatus]);


  useEffect(() =>{
    fetchStocks();
  },[]);

  //function to fetch all farmers
  const fetchStocks = async () => {
  setIsLoading(true);
  
  try{
    const response = await axios.get(`${backendURL}/stocks`);
    if(response.status === 200){
      const data = response.data;
      setStocks(data);
      setFilteredStocks(data);
      setError("")
      const uniqueFarmers = [...new Set(data.map(stock => stock.farmerName))];
      const uniqueVegetables = [...new Set(data.map(stock => stock.vegetableName))];
      setFarmers(uniqueFarmers);
      setVegetables(uniqueVegetables);
    }
  }catch(err){
    setError("Error fetching stocks", err);
    console.log("Error fetching stocks",err);
  }finally{
    setIsLoading(false);
  }
};

  //function to send farmer data to farmer form when clicked on edit button
  const handleEdit = (stock) => {
    setSelectedStock(stock);
    setIsEdit(true);
    setIsFormOpen(true);
  }

  //function to open payment status and amount edit form
  const handlePaymentChange = (e,lotName) => {
    setEditedPaymentStatus(e.target.value);
    setIsEditPaymentStatus(true);
    setSelectedLotName(lotName);
  }

  //function to send edited data to the server
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formattedEditData = {
      paymentStatus :editedPaymentStatus,
      amount:editedAmount,
      modifiedBy: user.userName   
    };
    try{
      setIsLoading(true);
      const response = await axios.put(`${backendURL}/stocks/${selectedLotName}`,formattedEditData);
      console.log(selectedLotName)
      if(response.status === 200){
        toast.success(`${selectedLotName} updated successfully`);
      }
    }catch(err){
      toast.error("Failed to edit lot. Please try again!",err.message);
      console.log(err.message)
    }finally{
      setIsLoading(false);
      setIsEditPaymentStatus(false);
      setSelectedLotName(null);
      setEditedAmount("");
      fetchStocks();
    }
}
  //function to filter data based on selected farmer, vegetable and paymentStatus
  const filteredData = useMemo(() => {
    return stocks.filter(stock => {
      const stockDate = new Date(stock.createdAt);
      const fromDateTime = fromDate && fromTime ? new Date(`${fromDate} ${fromTime}`) : null;
      const toDateTime = toDate && toTime ? new Date(`${toDate} ${toTime}`) : null;
      
      return (
        (!selectedFarmer || stock.farmerName === selectedFarmer) &&
        (!selectedVegetable || stock.vegetableName === selectedVegetable) &&
        (!selectedPaymentStatus || stock.paymentStatus === selectedPaymentStatus) &&
        ((selectedStockStatus === "in stock" && stock.remainingBags > 0) ||
        (selectedStockStatus === "out of stock" && stock.remainingBags === 0) || !selectedStockStatus) &&
        (!fromDateTime || stockDate >= fromDateTime) &&
        (!toDateTime || stockDate <= toDateTime)
      );
    });
  }, [stocks, selectedFarmer, selectedVegetable, selectedPaymentStatus, fromDate, toDate, fromTime, toTime, selectedStockStatus]);

  useEffect(() => {
    setFilteredStocks(filteredData);
  }, [filteredData]);
  

  //function to remove filters
  const handleRemoveFilters = () => {
    setSelectedFarmer("");
    setSelectedVegetable("");
    setSelectedPaymentStatus("");
    setFromDate("");
    setToDate("");
    setSelectedStockStatus("");
    setFromTime("00:00 AM");
    setToTime("11:59 PM");
  };

  //function to handle cancel for payment status and amount
  const handleCancelPayment =()=>{
    setEditedAmount("");
    setEditedPaymentStatus("");
    setIsEditPaymentStatus(false);
    setSelectedLotName(null);
  }
  //function to delete selected farmer when clicked on delete button
  const handleDelete = async (lotName) => {
    setIsLoading(true);
    try{
      const response = await axios.delete(`${backendURL}/stocks/${lotName}`);
      if(response.status === 200){
        toast.success("Stock deleted successfully");
        fetchStocks();
      }
    }catch(err){
      toast.error(`Error deleting stock: ${err.message}`);
      console.log("Error deleting stock",err);
    }finally{
      setIsLoading(false);
    }
  }

  return (
    <section className="flex flex-col w-[100%-110px] min-h-screen p-5 ml-[100px] overflow-auto">
      {/* filters */}
      <div className="flex flex-col gap-2">
        <div className='flex flex-row gap-2'>
          <div className='flex flex-col gap-1'>
            <label className='text-sm text-gray-600 font-medium'>
                From Date:
            </label>
            <input 
              type="date" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)} 
              className="p-4 rounded-md text-white font-medium bg-blue-400 shadow-sm" 
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>From Time:</label>
            <select value={fromTime} onChange={(e) => setFromTime(e.target.value)} className="p-4 rounded-md bg-blue-400 text-white">
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
                onChange={(e) => setToDate(e.target.value)} className="p-4 rounded-md text-white font-medium bg-blue-400 shadow-sm" 
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>To Time:</label>
            <select value={toTime} onChange={(e) => setToTime(e.target.value)} className="p-4 rounded-md bg-blue-400 text-white">
              {generateTimeSlots().map((slot, idx) => <option key={idx} value={slot}>{slot}</option>)}
            </select>
          </div>
          <button onClick={() => setIsHistory(!isHistory)}
            className="p-4 px-8 rounded-md text-white font-medium bg-blue-400 shadow-sm">
            History
          </button>
          <button onClick={() => setIsFormOpen(true)} className="px-4 py-2 rounded-md text-white font-medium bg-green-500 shadow-sm">
              Add New Lot
            </button>
        </div>
        <div className='flex flex-row gap-2'>
          <Autocomplete
            className="bg-blue-500 rounded-md border-none mui-white-text w-[150px]"
            options={farmers.map(farmer => farmer)}
            value={selectedFarmer}
            onChange={(event, newValue) => {
              setSelectedFarmer(newValue || '');
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Farmer Name"
                variant="outlined"
                fullWidth
              />
            )}
          />
            <Autocomplete
            className="bg-blue-500 rounded-md border-none mui-white-text w-[150px]"
            options={vegetables.map(veggie => veggie)}
            value={selectedVegetable}
            onChange={(event, newValue) => {
              setSelectedVegetable(newValue || '');
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Vegetable Name"
                variant="outlined"
                fullWidth
              />
            )}
          />
          <select value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            className="px-4 py-2 rounded-md text-white font-medium bg-blue-500 shadow-sm">
              <option value="">Payment Status</option>
              <option value="due">due</option>
              <option value="complete">paid</option>
          </select>
          <select value={selectedStockStatus}
            onChange={(e) => setSelectedStockStatus(e.target.value)}
            className="px-4 py-2 rounded-md text-white font-medium bg-blue-500 shadow-sm">
              <option value="">Stock Status</option>
              <option value="in stock">
                  In stock
              </option>
              <option value="out of stock">
                Out of stock
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
      </div>
      {/* filters */}
      {/* table */}
      <table className="bg-white w-full mt-5 border-separate border border-black rounded-lg">
        <thead>
          <tr className="text-left text-[16px] text-black">
            <th className="border border-black p-2">Lot name</th>
            <th className="border border-black p-2">Farmer</th>
            <th className="border border-black pl-2">Vegetable</th>
            <th className="border border-black pl-2">No.of bags</th>
            <th className="border border-black pl-2">Remaining bags</th>
            <th className="border border-black pl-2">Payment Status</th>
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
              {filteredStocks && filteredStocks.map((stock) => (
                <tr key={stock._id} className="text-left">
                  <td className="border border-black p-2 ">{stock.lotName?.split('-').slice(0, 3).join('-')}</td>
                  <td className="border border-black p-2 ">{stock.farmerName}</td>
                  <td className="border border-black p-2">{stock.vegetableName}</td>
                  <td className="border border-black p-2">{stock.numberOfBags}</td>
                  <td className="border border-black p-2">{stock.remainingBags}</td>
                  <td className={`${stock.paymentStatus === "due" ? "text-red-500":"text-green-500"} border border-black p-2 font-medium`}>
                    {stock.paymentStatus === "due" ? (
                      <select onChange={(e) => handlePaymentChange(e,stock.lotName)} value={stock.paymentStatus}>
                      <option value="due" className='text-red-500 font-medium'>due</option>
                      <option value="complete" className='text-green-500 font-medium'>paid</option>
                    </select>
                    ):<p className='text-green-500 font-medium'>Paid</p>}
                    
                    
                  </td>
                  <td className={`${!stock.amount ? "" : stock.paymentStatus === "due" ? "text-red-500":"text-green-500"} border border-black p-2 font-medium`}>{stock.amount}</td>
                  <td className="border border-black p-2">{stock.createdBy}</td>
                  <td className="border border-black p-2">{new Date(stock.createdAt).toLocaleString()}</td>
                  <td className="border border-black p-2">
                    <button onClick={() => handleEdit(stock)} className="bg-gray-200 text-[#1E90FF] font-bold cursor-pointer px-4 py-2 rounded">
                      Edit
                    </button>
                  </td>
                  <td className="border border-black p-2">
                    <button onClick={(e) =>{
                      e.stopPropagation();
                      handleDelete(stock.lotName);
                    }} className="text-[#D74848] font-bold cursor-pointer px-4 py-2 rounded bg-gray-200">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          )} 
      </table>
      {isFormOpen && (
        <div onClick={() => setIsFormOpen(false)} className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
          <div onClick={(e) => e.stopPropagation()}>
            <AddLotForm
              onClose={() => setIsFormOpen(false)}
              fetchLots={fetchStocks}
              stock={selectedStock}
              isEdit={isEdit}
              onCloseEdit={() => setIsEdit(false)}
            />
          </div>
      </div>
      )}
      {isEditPaymentStatus && (
        <div onClick={() => setIsEditPaymentStatus(false)} className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
          <div onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleEditSubmit} className='flex flex-col gap-4 justify-center items-center bg-white p-4 shadow-md rounded-md'>
                <h2 className={`${editedPaymentStatus === "due" ? "text-red-500":"text-green-500"} text-lg font-medium`}>
                  Payment Status: {editedPaymentStatus}
                </h2>
              <InputField 
                inputRef={inputRef}
                label="Amount"
                placeholder="Enter amount"
                value={editedAmount}
                onChange={(e) => setEditedAmount(e.target.value)}
              />
              <div className='flex flex-row gap-2'>
                <button type="button" onClick={handleCancelPayment} className="px-4 py-2 rounded text-white font-medium bg-[#D74848]">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 w-[200px] rounded text-white font-medium bg-[#1E90FF]">
                    {isLoading ? <LoadingSpinner/>:"Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isHistory && (
        <div onClick={() => setIsHistory(false)} className='fixed inset-0 flex justify-center items-center bg-black/50 z-50'>
          <div onClick={(e) => e.stopPropagation()} className='w-3/4 max-w-2xl h-3/4 bg-white rounded-lg shadow-lg overflow-hidden'>
            <div className='h-full overflow-y-auto p-6'>
              <StockHistory onClose={() => setIsHistory(false)}/>
            </div>
          </div>
      </div>
      )}
    </section>
  )
}

export default StockPage;