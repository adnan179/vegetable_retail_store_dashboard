import React, {useState, useEffect, useMemo, useRef } from 'react'
import axios from "axios";
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/loadingSpinner';
import EditCreditForm from '../components/editCreditForm';
import InputField from '../components/inputField';
import closeIcon from "../assets/icons8-close-48.png";
import { useAuth } from '../context/AuthContext';

const CreditsPage = () => {
  const { backendURL } = useAuth()
  const inputRef = useRef(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
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
  const [totalCreditsTillDate, setTotalCreditsTillDate] = useState(0);
  const [totalCreditsToday, setTotalCreditsToday] = useState(0);
  const amountRanges = [
    "0-10000", "11000-20000","21000-30000","31000-40000","41000-50000","51000-60000","61000-70000","71000-80000","81000-90000","91000-100000"];
  
  const [paymentData, setPaymentData] = useState({
    creditAmount: selectedCredit? selectedCredit.creditAmount : 0,
    less:0,
  });

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

          // Function to extract and convert date from createdBy
          const parseCreatedByDate = (createdBy) => {
            if (!createdBy) return null;
            
              const parts = createdBy.split("-");
              if (parts.length < 5) return null; // Ensure format is valid
              
              const [name, day, month, year, time] = parts;
              
              // Convert time to 24-hour format for Date parsing
              let [timeValue, period] = time.split(" ");
              let [hours, minutes] = timeValue.split(":").map(Number);

              if (period.toLowerCase() === "pm" && hours !== 12) {
                hours += 12;
              } else if (period.toLowerCase() === "am" && hours === 12) {
                hours = 0;
              }

              // Create a valid date object
              return new Date(`${year}-${month}-${day}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`);
            };

            // Sorting customers based on `createdBy` date extracted
            const sortedCredits = data.sort((a, b) => {
              const dateA = parseCreatedByDate(a.createdBy) || new Date(0);
              const dateB = parseCreatedByDate(b.createdBy) || new Date(0);
              return dateB - dateA; // Sort in descending order (most recent first)
            });

          setCredits(sortedCredits);
          setFilteredCredits(sortedCredits);

          const uniqueCustomers = [...new Set(data.map((sale) => sale.customerName))];
          setCustomers(uniqueCustomers);
          const total = data.reduce((sum, current) => {
            return sum + current.creditAmount;
          }, 0);
          setTotalCreditsTillDate(total);
  
          const today = new Date()
          .toLocaleDateString("en-GB")
          .split("/")
          .join("-");
  
          const totalToday = data
            .filter((credit) => {
              const parts = credit.createdBy.split("-");
              if(parts.length >= 4){
                const creditDate = `${parts[1]}-${parts[2]}-${parts[3]}`;
                return creditDate === today;
              }
              return false;
            })
            .reduce((acc, credit) => acc + credit.creditAmount,0);
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
  };

  const handleIsPayment = (credit) => {
    setSelectedCredit(credit);
    setIsPaymentOpen(true);
    
  }

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try{
      const formattedData = {
        creditAmount: paymentData.creditAmount,
        less: paymentData.less,
        payment:"payment paid",
      }
      const response = await axios.put(`${backendURL}/credits/${selectedCredit.creditId}`, formattedData);
      if(response.status === 200){
        toast.success("Credit paid successfully");
      }
    }catch(err){
      console.log("Error paying credit",err);
      toast.error("Error paying credit",err.message);
    }finally{
      setIsLoading(false);
      setSelectedCredit(null);
      fetchCredits();
      setIsPaymentOpen(false);

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
  
    return credits.filter(credit => {
      const stockDate = parseDate(credit.createdBy); // Extract and convert date
      // Ensure toDate includes the full day (set time to 23:59:59)
      const adjustedToDate = toDate ? new Date(toDate) : null;
      if (adjustedToDate) {
        adjustedToDate.setHours(23, 59, 59, 999);
      }
      return (
        (!selectedCustomer || credit.customerName === selectedCustomer) &&
        (!selectedPayment || (credit.payment === selectedPayment)) &&
        (!selectedAmount || (credit.creditAmount && credit.creditAmount >= parseInt(selectedAmount.split('-')[0]) && credit.creditAmount <= parseInt(selectedAmount.split('-')[1]))) &&
        (!fromDate || !toDate || (stockDate && stockDate >= new Date(fromDate) && stockDate <= new Date(adjustedToDate)))
      );
    });
  }, [credits, selectedCustomer,selectedAmount,fromDate, toDate, selectedPayment]);
  
  
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
    <section className="flex flex-col w-full min-h-screen p-5 ml-[100px] overflow-auto">
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
            <label className='text-sm text-gray-600 font-medium'>
              To Date:
            </label>
            <input 
              type="date" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)} className="px-4 py-2 rounded-md text-white font-medium bg-blue-400 shadow-sm" 
            />
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
          <select value={selectedPayment}
            onChange={(e) => {
              setSelectedPayment(e.target.value)
              console.log(e.target.value)
            }}
            className="px-4 py-2 rounded-md text-white font-medium bg-blue-400 shadow-sm">
              <option value="">Payment</option>
              <option value="payment paid">Paid</option>
              <option value="payment due">Not Paid</option>
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
            <th className="border border-black p-2">Credit Id</th>
            <th className="border border-black p-2">Customer name</th>
            <th className="border border-black pl-2">Amount</th>
            <th className="border border-black pl-2">Less</th>
            <th className="border border-black pl-2">Payment</th>
            <th className="border border-black pl-2">Created By</th>
            <th className="border border-black pl-2">Modified By</th>
            <th className="border border-black p-2"></th>
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
                    <td className="border border-black p-2 ">{credit.creditId}</td>
                    <td className="border border-black p-2 ">{credit.customerName}</td>
                    <td className="border border-black p-2 text-[#FF0000]">{credit.creditAmount}</td>
                    <td className="border border-black p-2">{credit.less}</td>
                    <td className={`${credit.payment === "payment paid" ? "text-green-500":"text-red-500"} font-medium border border-black p-2`}>{credit.payment}</td>
                    <td className="border border-black p-2">{credit.createdBy}</td>
                    <td className="border border-black p-2">{credit.modifiedBy ? credit.modifiedBy : ""}</td>
                    <td className="border border-black p-2">
                      {credit.payment === "payment paid" ? (
                        <p className='text-green-500 font-medium text-lg'>Paid</p>
                      ) : (
                        <button onClick={() => {
                          handleIsPayment(credit)
                        }} 
                          className="bg-gray-200 text-[#1E90FF] font-bold cursor-pointer px-4 py-2 rounded">
                            Pay
                        </button>
                      )}
                    
                    </td>
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
            onCloseEdit={() => {
              setSelectedCredit(null)
              setIsFormOpen(false)
            }}
            fetchCredits={fetchCredits}
            credit={selectedCredit}
          />
        </div>
        )}
        {isPaymentOpen && (
          <div className='z-30 fixed inset-0 flex w-full min-h-screen bg-black/50 justify-center items-center'>
            <form onSubmit={handlePayment} className='p-3 rounded-md bg-white shadow-sm flex flex-col gap-3'>
              <div className='flex flex-row w-full justify-between items-center'>
                <h2 className='text-lg font-semibold'>Pay Jamalu</h2>
                <img src={closeIcon} alt="close icon" className="w-4 h-4 cursor-pointer" 
                  onClick={() => {
                    setSelectedCredit(null)
                    setIsPaymentOpen(false)
                  }}
                />
              </div>
              <InputField 
                inputRef={inputRef}
                label="Credit Amount"
                placeholder="Enter Credit Amount"
                value={paymentData.creditAmount}
                onChange={(e) => setPaymentData({ ...paymentData, creditAmount: e.target.value })}
              />
              <InputField 
                label="Less"
                placeholder="Enter less"
                value={paymentData.less}
                onChange={(e) => setPaymentData({ ...paymentData, less: e.target.value })}
              />
              <p className='text-lg font-medium'>Total Amount: {paymentData.creditAmount - paymentData.less}</p>
              <button type='submit' className='w-full px-4 py-2 rounded-md bg-[#1E90FF] text-white font-medium'>Submit</button>
            </form>
          </div>
        )}
    </section>
  )
}

export default CreditsPage;