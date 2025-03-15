import React,{ useState, useEffect, useRef} from 'react'
import { useAuth } from '../context/AuthContext';
import closeIcon from "../assets/icons8-close-48.png";
import InputField from './inputField';
import { toast } from 'react-toastify';
import axios from "axios";
import LoadingSpinner from './loadingSpinner';

const EditCreditForm = ({ isEdit,fetchCredits, credit,onClose, onCloseEdit}) => {
  const selectedCreditId = credit?.creditId;
  const { user, backendURL } = useAuth();
  const [formData, setFormData] = useState({
    customerName:isEdit? credit?.customerName:"",
    creditAmount : isEdit? credit?.creditAmount:"",
    less : isEdit? credit?.less:"",
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  //function to reset the form values
  const inputRef = useRef(null);

  //function to focus on the first input field in the form
  useEffect(() => {
      inputRef.current?.focus();
  }, []);

  //function to fetch customers data
  useEffect(() => {
    const fetchData =  async () => {
        try{
            const response = await axios.get(`${backendURL}/customers`);
            if(response.status === 200){
                const data = response.data;
                const sortedData = data.sort((a,b) => a -b)
                setCustomers(sortedData);
            }
        }catch(err){
            toast.error("Failed to fetch customers");
            console.log("Failed to fetch customers",err.message)
        }
    }
    fetchData();
},[]);

  // func to reset form values
  const handleCancel = () => {
    setFormData({
      customerName:"",
      creditAmount:"",
      less:"",
    });
    setSelectedCustomer("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // formatted data for submission
    const generateCreditId = () => {
      return `credit-${Math.floor(100000 + Math.random() * 900000)}`;
    };
    const creditId = generateCreditId();
    const formattedData = {
      creditId:creditId,
      customerName:formData.customerName,
      creditAmount: formData.creditAmount,
      less: formData.less,
      createdBy: user.userName
    };
      
    // Submit to API
    try{
      const response = await axios.post(`${backendURL}/credits`, formattedData);
      if(response.status === 200){
        console.log(formattedData);
        handleCancel();
        onCloseEdit();
        toast.success("Credit added successfully");
        fetchCredits();
      }
        
    }catch(err){
      setError(err.message);
      setTimeout(() => setError(null), 3000);
      toast.error("Failed to add Credit.Please try again!");
      console.log("Failed to add.",err.message);
    }finally{
        setIsLoading(false);
    } 
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formattedData = {
      creditId:selectedCreditId,
      customerName:formData.customerName,
      creditAmount: formData.creditAmount,
      less: formData.less,
      modifiedBy:user.userName,
    };
      
    // Submit to API
    try{
      const response = await axios.put(`${backendURL}/credits/${selectedCreditId}`, formattedData);
      if(response.status === 200){
        console.log(formattedData);
        handleCancel();
        onCloseEdit();
        toast.success("Edited Credit successfully");
        fetchCredits();
      }
        
    }catch(err){
      setError(err.message);
      setTimeout(() => setError(null), 3000);
      toast.error("Failed to edit Credit.Please try again!");
      console.log("Failed to edit.",err.message);
    }finally{
        setIsLoading(false);
    } 
  };

   
  return (
    <form onSubmit={isEdit ? handleEditSubmit : handleSubmit} className="flex flex-col gap-4 justify-center items-center bg-white p-4 shadow-md rounded-md">
      <div className="flex flex-row justify-between items-center w-full">
        <h2 className="text-black font-semibold text-xl">
          {isEdit ? "Edit credit data":"Add credit"}
        </h2>
        <img src={closeIcon} alt="close icon" className="w-4 h-4 cursor-pointer" 
          onClick={() => {
            onClose();
            onCloseEdit();
          }}
        />
      </div>
      <select className='w-full p-2 bg-[#d9d9d9] rounded-md' 
        value={formData.customerName}
        onChange={(e) => {
            const selected = customers.find(c => c.customerName === e.target.value);
            setFormData({...formData, customerName: e.target.value});
            setSelectedCustomer(selected || null);
        }}>
        <option value="">Customer Name</option>
        {customers && customers.map((customer, idx) => (
            <option key={idx} value={customer.customerName}>{customer.customerName}</option>
        ))}
      </select>

      {selectedCustomer && (
        <h2 className='w-full text-[16px]'>Balance: <span className='text-red-600 font-medium'>{selectedCustomer.balance}</span></h2>
      )}
      {/* Reusable Input Fields */}
      <InputField
        inputRef={inputRef}
        label="Credit Amount"
        placeholder="Enter Credit Amount"
        value={formData.creditAmount}
        onChange={(e) => setFormData({ ...formData, creditAmount: e.target.value })}
      />
      <InputField
        label="Less"
        placeholder="Enter Less"
        value={formData.less}
        onChange={(e) => setFormData({ ...formData, less: e.target.value })}
      />
      <h2 className='w-full text-lg'>Total Amount: <span className='text-green-500 font-medium'>{formData.creditAmount - formData.less}</span></h2>
      <div className="flex flex-row gap-3">
        <button type="button" onClick={handleCancel} className="px-4 py-2 rounded text-white font-medium bg-[#D74848]">
            Cancel
        </button>
        <button type="submit" className="px-4 py-2 w-[200px] rounded text-white font-medium bg-[#1E90FF]">
            {isLoading ? <LoadingSpinner/>:"Submit"}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
    </form>
  )
}

export default EditCreditForm;