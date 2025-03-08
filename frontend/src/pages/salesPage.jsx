import React, {useState, useEffect, useMemo } from 'react'
import axios from "axios";
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/loadingSpinner';
import AddSalesForm from '../components/addSalesForm';
import { useAuth } from '../context/AuthContext';

const SalesPage = () => {
  const { backendURL} = useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sales,setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [lots, setLots] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedLot, setSelectedLot] = useState("");
  const [selectedAmount, setSelectedAmount] = useState("");
  const [isKuli, setIsKuli] = useState(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [totalSalesTillDate, setTotalSalesTillDate] = useState(0);
  const [totalSalesToday, setTotalSalesToday] = useState(0);



  useEffect(() =>{
    fetchSales();
  },[]);

  //function to fetch all sales
  const fetchSales = async () => {
    setIsLoading(true);
  
    // Function to sort sales data in the most recent order
    const sortedSales = (data) => {
      return data.sort((a, b) => {
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
  
        return parseDate(b.createdBy) - parseDate(a.createdBy); // Sort in descending order
      });
    };
  
    try {
      const response = await axios.get(`${backendURL}/sales`);
      if (response.status === 200) {
        const data = response.data;
        const sortedData = sortedSales(data); // Apply sorting
        setSales(sortedData);
        setFilteredSales(sortedData);
        setError("");
  
        const uniqueCustomers = [...new Set(data.map((sale) => sale.customerName))];
        const uniqueLots = [...new Set(data.map((sale) => sale.lotName))];
        setCustomers(uniqueCustomers);
        setLots(uniqueLots);
        const total = data.reduce((sum,current) => {
          return sum + current.totalAmount;
        },0);
        setTotalSalesTillDate(total);

        const today = new Date()
          .toLocaleDateString("en-GB")
          .split("/")
          .join("-");
        
          const totalToday = data
            .filter((sale) => {
              const parts = sale.createdBy.split("-");
              if(parts.length >= 4){
                const saleDate = `${parts[1]}-${parts[2]}-${parts[3]}`;
                return saleDate === today;
              }
              return false;
            }).reduce((acc, sale) => acc + sale.totalAmount,0);
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
  
    return sales.filter(sale => {
      const stockDate = parseDate(sale.createdBy); // Extract and convert date
      // Ensure toDate includes the full day (set time to 23:59:59)
      const adjustedToDate = toDate ? new Date(toDate) : null;
      if (adjustedToDate) {
        adjustedToDate.setHours(23, 59, 59, 999);
      }
      return (
        (!selectedCustomer || sale.customerName === selectedCustomer) &&
        (!selectedLot || sale.lotName === selectedLot) &&
        (!isKuli || sale.kuli === isKuli) &&
        (!selectedPaymentType || sale.paymentType === selectedPaymentType) &&
        (!selectedAmount || (sale.totalAmount && sale.totalAmount >= parseInt(selectedAmount.split('-')[0]) && sale.totalAmount <= parseInt(selectedAmount.split('-')[1]))) &&
        (!fromDate || !toDate || (stockDate && stockDate >= new Date(fromDate) && stockDate <= new Date(adjustedToDate)))
      );
    });
  }, [sales, selectedCustomer, selectedLot,isKuli,selectedAmount, selectedPaymentType,fromDate, toDate]);
  
  
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
    setIsKuli(null);
    setSelectedPaymentType(null);
  };
  //function to delete selected farmer when clicked on delete button
  const handleDelete = async (saleId) => {
    setIsLoading(true);
    try{
      const response = await axios.delete(`${backendURL}/sales/${saleId}`);
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
  }

  return (
    <section className="flex flex-col w-full min-h-screen p-5 ml-[100px] overflow-auto">
      {/* sales information */}
      <div className='flex flex-row gap-3'>
        <div className='flex flex-col p-2 rounded-md bg-white shadow'>
          <h3 className='font-medium text-sm'>Total Sales till date</h3>
          <h1 className='text-xl font-medium text-[#1E90FF]'>{totalSalesTillDate ? totalSalesTillDate : 0}</h1>
        </div>
        <div className='flex flex-col p-2 rounded-md bg-white shadow'>
          <h3 className='font-medium text-sm'>Total Sales Today</h3>
          <h1 className='text-xl font-medium text-[#1E90FF]'>{totalSalesToday ? totalSalesToday : 0}</h1>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
            Add New Sale
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
            
          <select value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
              <option value="">Customers</option>
              {customers && customers.map((customer,idx) => (
                <option key={idx} value={customer}>
                  {customer}
                </option>
              ))}
          </select>
          <select value={selectedLot}
            onChange={(e) => setSelectedLot(e.target.value)}
            className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
              <option value="">Lot names</option>
              {lots && lots.map((lot,idx) => (
                <option key={idx} value={lot}>
                  {lot}
                </option>
              ))}
          </select>
          <select value={isKuli}
            onChange={(e) => setIsKuli(e.target.value)}
            className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
              <option value="">Kuli</option>
              <option value="true" className='text-green-500 font-medium'>
                True
              </option>
              <option value="false" className='text-red-500 font-medium'>
                False
              </option>
          </select>
          <select value={selectedPaymentType}
            onChange={(e) => setSelectedPaymentType(e.target.value)}
            className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
              <option value="">Payment Type</option>
              <option value="cash" className='text-green-500 font-medium'>
                cash
              </option>
              <option value="jamalu" className='text-red-500 font-medium'>
                jamalu
              </option>
          </select>
          <button 
            onClick={() => {
              handleRemoveFilters();
              }} 
              className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
              Remove Filters
          </button>
        </div>
        {/* filters */}
        {/* table */}
        <table className="bg-white w-full mt-5 border-separate border border-black rounded-lg">
          <thead>
            <tr className="text-left text-[16px] text-black">
              <th className="border border-black p-2">Sale Id</th>
              <th className="border border-black p-2">Customer name</th>
              <th className="border border-black p-2">Lot name</th>
              <th className="border border-black p-2">Number of kgs</th>
              <th className="border border-black pl-2">Price per kg</th>
              <th className="border border-black pl-2">Kuli</th>
              <th className="border border-black pl-2">Payment Type</th>
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
                {filteredSales && filteredSales.map((sale) => (
                  <tr key={sale._id} className="text-left">
                    <td className="border border-black p-2 ">{sale.salesId}</td>
                    <td className="border border-black p-2 ">{sale.customerName}</td>
                    <td className="border border-black p-2 ">{sale.lotName}</td>
                    <td className="border border-black p-2">{sale.numberOfKgs}</td>
                    <td className="border border-black p-2">{sale.pricePerKg}</td>
                    <td className={`${sale.kuli === "false" ? "text-red-500":"text-green-500"} border border-black p-2 font-medium`}>{sale.kuli}</td>
                    <td className="border border-black p-2">{sale.paymentType}</td>
                    <td className={`${sale.paymentType === "jamalu" ? "text-red-500":"text-green-500"} border border-black p-2 font-medium`}>{sale.totalAmount}</td>
                    <td className="border border-black p-2">{sale.createdBy}</td>
                    <td className="border border-black p-2">{sale.modifiedBy ? sale.modifiedBy : ""}</td>
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
              </tbody>
            )} 
        </table>
        {isFormOpen && (
          <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
          <AddSalesForm
            onClose={() => setIsFormOpen(false)}
            fetchSales={fetchSales}
            sale={selectedSale}
            isEdit={isEdit}
            onCloseEdit={() => setIsEdit(false)}
          />
        </div>
        )}
    </section>
  )
}

export default SalesPage;