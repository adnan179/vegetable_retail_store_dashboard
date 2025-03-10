import React, {useState, useEffect, useMemo, useRef } from 'react'
import axios from "axios";
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/loadingSpinner';
import AddLotForm from '../components/addLotForm';
import InputField from '../components/inputField';
import { useAuth } from '../context/AuthContext';

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
  const [selectedStock, setSelectedStock] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const paymentStatuses = ["due","paid"];
  const [editedPaymentStatus, setEditedPaymentStatus] = useState("");
  const [editedAmount, setEditedAmount] = useState(0);
  const [isEditPaymentStatus, setIsEditPaymentStatus] = useState(false);
  const [selectedLotName, setSelectedLotName] = useState(null);
  const inputRef = useRef(null);

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

  //func to sort the data in most recent manner
  const sortedStocks = (data) =>{

    return data.sort((a, b) => {
    const parseDate = (str) => {
      const parts = str.split("-"); // Split by "-"
      const day = parts[1];
      const month = parts[2];
      const year = parts[3];

      // Extract time and AM/PM
      const timeParts = parts[4].split(" ");
      const time = timeParts[0]; // HH:MM
      const ampm = timeParts[1]; // am/pm

      const [hours, minutes] = time.split(":").map(Number);

      // Convert to 24-hour format
      let finalHours = hours;
      if (ampm.toLowerCase() === "pm" && hours !== 12) {
          finalHours += 12;
      } else if (ampm.toLowerCase() === "am" && hours === 12) {
          finalHours = 0;
      }

      return new Date(`${year}-${month}-${day}T${finalHours}:${minutes}:00`);
    };

    return parseDate(b.createdBy) - parseDate(a.createdBy);
  })};
  
  try{
    const response = await axios.get(`${backendURL}/stocks`);
    if(response.status === 200){
      const data = response.data;
      setStocks(data);
      setFilteredStocks(sortedStocks(data));
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
    
    // Get current date and time
    const now = new Date();
    const formattedEditDate = now.toLocaleDateString("en-GB").replace(/\//g, "-"); // Formats as DD-MM-YY
    const formattedEditTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase(); // Formats as hh:mm am/pm
    const formattedEditTimestamp = `${formattedEditDate}-${formattedEditTime}`;
    const formattedEditData = {
      paymentStatus :editedPaymentStatus,
      amount:editedAmount,
      modifiedBy: `${user.userName}-${formattedEditTimestamp}`   
    };
    try{
      setIsLoading(true);
      const response = await axios.put(`${backendURL}/${selectedLotName}`,formattedEditData);
      console.log(selectedLotName)
      if(response.status === 200){
        toast.success(`${selectedLotName} updated successfully`);
      }
    }catch(err){
      toast.error("Failed to edit lot. Please try again!",err.message);
      console.log(err)
    }finally{
      setIsLoading(false);
      setIsEditPaymentStatus(false);
      setSelectedLotName(null);
      setEditedAmount(0);
      fetchStocks();
    }
}
  //function to filter data based on selected farmer, vegetable and paymentStatus
  const filteredData = useMemo(() => {
    const parseDate = (str) => {
      if (!str) return null;
      const parts = str.split("-"); // Split by "-"
      const day = parts[1];
      const month = parts[2];
      const year = parts[3];
  
      // Extract time and AM/PM
      const timeParts = parts[4].split(" ");
      const time = timeParts[0]; // HH:MM
      const ampm = timeParts[1]; // am/pm
  
      const [hours, minutes] = time.split(":").map(Number);
  
      // Convert to 24-hour format
      let finalHours = hours;
      if (ampm.toLowerCase() === "pm" && hours !== 12) {
        finalHours += 12;
      } else if (ampm.toLowerCase() === "am" && hours === 12) {
        finalHours = 0;
      }
  
      return new Date(`${year}-${month}-${day}T${finalHours}:${minutes}:00`);
    };
  
    return stocks.filter(stock => {
      const stockDate = parseDate(stock.createdBy); // Extract and convert date
      // Ensure toDate includes the full day (set time to 23:59:59)
      const adjustedToDate = toDate ? new Date(toDate) : null;
      if (adjustedToDate) {
        adjustedToDate.setHours(23, 59, 59, 999);
      }
      return (
        (!selectedFarmer || stock.farmerName === selectedFarmer) &&
        (!selectedVegetable || stock.vegetableName === selectedVegetable) &&
        (!selectedPaymentStatus || stock.paymentStatus === selectedPaymentStatus) &&
        (!fromDate || !toDate || (stockDate && stockDate >= new Date(fromDate) && stockDate <= new Date(adjustedToDate)))
      );
    });
  }, [stocks, selectedFarmer, selectedVegetable, selectedPaymentStatus, fromDate, toDate]);
  
  
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
  };

  //function to handle cancel for payment status and amount
  const handleCancelPayment =()=>{
    setEditedAmount(0);
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
    <section className="flex flex-col w-full min-h-screen p-5 ml-[100px] overflow-auto">
        {/* filters */}
        <div className="flex flex-row gap-5">
            <div className='flex flex-col gap-1'>
                <label className='text-sm text-gray-600 font-medium'>
                    From Date:
                </label>
                <input 
                    type="date" 
                    value={fromDate} 
                    onChange={(e) => setFromDate(e.target.value)} className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm" 
                />
            </div>
            <div className='flex flex-col gap-1'>
                <label className='text-sm text-gray-600 font-medium'>
                    To Date:
                </label>
                <input 
                    type="date" 
                    value={toDate} 
                    onChange={(e) => setToDate(e.target.value)} className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm" 
                />
            </div>
            
            <select value={selectedFarmer}
            onChange={(e) => setSelectedFarmer(e.target.value)}
              className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
                <option value="">Farmers</option>
                {farmers && farmers.map((farmer,idx) => (
                  <option key={idx} value={farmer}>
                    {farmer}
                  </option>
                ))}
            </select>
            <select value={selectedVegetable}
              onChange={(e) => setSelectedVegetable(e.target.value)}
              className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
                <option value="">Vegetables</option>
                {vegetables && vegetables.map((vegetable,idx) => (
                  <option key={idx} value={vegetable}>
                    {vegetable}
                  </option>
                ))}
            </select>
            <select value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
                <option value="">Payment Status</option>
                {paymentStatuses && paymentStatuses.map((paymentStatus,idx) => (
                  <option key={idx} value={paymentStatus}>
                    {paymentStatus}
                  </option>
                ))}
            </select>
            <button 
              onClick={() => {
                handleRemoveFilters();
                }} 
                className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
                Remove Filters
            </button>
            <button onClick={() => setIsFormOpen(true)} className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
              Add New Lot
            </button>
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
              <th className="border border-black pl-2">Modified By</th>
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
                    <td className="border border-black p-2 ">{stock.lotName.split('-').slice(0, 3).join('-')}</td>
                    <td className="border border-black p-2 ">{stock.farmerName}</td>
                    <td className="border border-black p-2">{stock.vegetableName}</td>
                    <td className="border border-black p-2">{stock.numberOfBags}</td>
                    <td className="border border-black p-2">{stock.remainingBags}</td>
                    <td className={`${stock.paymentStatus === "due" ? "text-red-500":"text-green-500"} border border-black p-2 font-medium`}>
                      <select onChange={(e) => handlePaymentChange(e,stock.lotName)} value={stock.paymentStatus}>
                        <option value="due" className='text-red-500 font-medium'>due</option>
                        <option value="complete" className='text-green-500 font-medium'>paid</option>
                      </select>
                      
                    </td>
                    <td className={`${!stock.amount ? "" : stock.paymentStatus === "due" ? "text-red-500":"text-green-500"} border border-black p-2 font-medium`}>{stock.amount}</td>
                    <td className="border border-black p-2">{stock.createdBy}</td>
                    <td className="border border-black p-2">{stock.modifiedBy ? stock.modifiedBy : ""}</td>
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
          <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
          <AddLotForm
            onClose={() => setIsFormOpen(false)}
            fetchLots={fetchStocks}
            stock={selectedStock}
            isEdit={isEdit}
            onCloseEdit={() => setIsEdit(false)}
          />
        </div>
        )}
        {isEditPaymentStatus && (
          <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
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
        )}
    </section>
  )
}

export default StockPage;