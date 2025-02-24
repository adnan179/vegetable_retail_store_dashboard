import React, {useState, useEffect } from 'react'
import AddFarmerForm from '../components/addFarmerForm';
import axios from "axios";
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/loadingSpinner';

const StockPage = () => {
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
  const paymentStatuses = ["due","complete"];

  useEffect(() =>{
    fetchStocks();
  },[]);

  //function to fetch all farmers
  const fetchStocks = async () => {
    setIsLoading(true);
    try{
      const response = await axios.get("http://localhost:5000/api/stocks");
      if(response.status === 200){
        const data = response.data;
        setStocks(data);
        setFilteredStocks(data);

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
    setIsEdit(true);
    setSelectedStock(stock);
    setIsFormOpen(true);
  }

  //function to filter data based on selected farmer, vegetable and paymentStatus
  useEffect(() => {
    let filteredData = stocks;
    if(selectedFarmer){
      filteredData = filteredData.filter(stock => stock.farmerName === selectedFarmer);
    }
    if(selectedVegetable){
      filteredData = filteredData.filter(stock => stock.vegetableName === selectedVegetable);
    }
    if(setSelectedPaymentStatus){
        filteredData = filteredData.filter(stock => stock.paymentStatus === selectedPaymentStatus);
    }
    if(fromDate && toDate){
        const from = new Date(fromDate);
        const to = new Date(toDate);
        filteredData = filteredData.filter(stock => {
            const createdDateStr = stock.createdBy.split("-").pop();
            const createdDate = new Date(createdDateStr);
            return createdDate >= from && createdDate <= to;
        })
    }

    setFilteredStocks(filteredData);
  },[selectedFarmer,selectedVegetable,selectedPaymentStatus,fromDate,toDate,stocks]);

  const handleCancel = () => {
    setSelectedFarmer("");
    setSelectedVegetable("");
    setSelectedPaymentStatus("");
    setFromDate("");
    setToDate("");
  }
  //function to delete selected farmer when clicked on delete button
  const handleDelete = async (farmerName) => {
    setIsLoading(true);
    try{
      const response = await axios.delete(`http://localhost:5000/api/stocks/${selectedStock.lotName}`);
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
                handleCancel();
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
                    <td className="border border-black p-2 ">{stock.lotName}</td>
                    <td className="border border-black p-2 ">{stock.farmerName}</td>
                    <td className="border border-black p-2">{stock.vegetableName}</td>
                    <td className="border border-black p-2">{stock.numberOfBags}</td>
                    <td className="border border-black p-2">{stock.paymentStatus}</td>
                    <td className="border border-black p-2">{stock.amount}</td>
                    <td className="border border-black p-2">{stock.createdBy}</td>
                    <td className="border border-black p-2">{stock.modifiedBy ? stock.modifiedBy : ""}</td>
                    <td className="border border-black p-2">
                      <button onClick={() => handleEdit(stock)}className="bg-gray-200 text-[#1E90FF] font-bold cursor-pointer px-4 py-2 rounded">
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
          <AddFarmerForm
            onClose={() => setIsFormOpen(false)}
            fetchFarmers={fetchStocks}
            stock={selectedStock}
            isEdit={isEdit}
            onCloseEdit={() => setIsEdit(false)}
          />
        </div>
        )}
    </section>
  )
}

export default StockPage;