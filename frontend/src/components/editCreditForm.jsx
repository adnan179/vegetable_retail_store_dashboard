import React,{ useState, useEffect, useRef} from 'react'
import { useAuth } from '../context/AuthContext';
import closeIcon from "../assets/icons8-close-48.png";
import InputField from './inputField';
import { toast } from 'react-toastify';
import axios from "axios";
import LoadingSpinner from './loadingSpinner';

const EditCreditForm = ({ fetchCredits, credit, onCloseEdit}) => {
  const selectedCreditId = credit?.creditId;
  const { user, backendURL } = useAuth();
  const [formData, setFormData] = useState({
    creditAmount : credit?.creditAmount,
    less : credit?.less,
    payment: credit?.payment,
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  //function to reset the form values
  const inputRef = useRef(null);

  //function to focus on the first input field in the form
  useEffect(() => {
      inputRef.current?.focus();
  }, []);

  // func to reset form values
  const handleCancel = () => {
    setFormData({
        creditAmount:"",
        less:"",
        payment:false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // formatted data for submission
    // Get current date and time
    const now = new Date();
    const formattedEditDate = now.toLocaleDateString("en-GB").replace(/\//g, "-"); // Formats as DD-MM-YY
    const formattedEditTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase(); // Formats as hh:mm am/pm
    const formattedEditTimestamp = `${formattedEditDate}-${formattedEditTime}`;
    const formattedData = {
      creditAmount: formData.creditAmount,
      less: formData.less,
      payment: formData.payment,
      modifiedBy: JSON.stringify(`${user.userName}-${formattedEditTimestamp}`)
    };
      
    // Submit to API
    try{
      const response = await axios.put(`${backendURL}/credits/${selectedCreditId}`, formattedData);
      if(response.status === 200){
        console.log(formattedData);
        handleCancel();
        onCloseEdit();
        toast.success("Credit edited successfully");
        fetchCredits();
      }
        
    }catch(err){
      setError(err.message);
      setTimeout(() => setError(null), 3000);
      toast.error("Failed to edit Credit.Please try again!");
      console.log("Failed to edit.",err);
    }finally{
        setIsLoading(false);
    } 
  };


   
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 justify-center items-center bg-white p-4 shadow-md rounded-md">
      <div className="flex flex-row justify-between items-center w-full">
        <h2 className="text-black font-semibold text-xl">
          "Edit Credit Data"
        </h2>
        <img src={closeIcon} alt="close icon" className="w-4 h-4 cursor-pointer" 
          onClick={() => {
            onCloseEdit();
          }}
        />
      </div>
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
      <select value={formData.payment}
            onChange={(e) => setFormData({...formData,payment:e.target.value})}
            className="w-full bg-[#d9d9d9] px-4 py-2 rounded-md text-black font-medium shadow-sm">
              <option value="">Payment</option>
              <option value="payment paid">Paid</option>
              <option value="payment due">Not Paid</option>
          </select> 
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