import React,{ useState, useEffect, useRef} from 'react'
import { useAuth } from '../context/AuthContext';
import closeIcon from "../assets/icons8-close-48.png";
import InputField from './inputField';
import { toast } from 'react-toastify';
import axios from "axios";
import LoadingSpinner from './loadingSpinner';

const AddOperatorForm = ({onClose, fetchOperators, operator, isEdit, onCloseEdit}) => {
  const selectedOperatorName = operator?.userName;
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    userName: isEdit? operator?.userName :"",
    password: isEdit ?operator?.password :"",
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
        userName:"",
        password:"",  
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // formatted data for submission
    const formattedData = {
      userName: formData.userName,
      password: formData.password, 
    };
      
    // Submit to API
    try{
      const response = await axios.post("http://localhost:5000/api/users/add-operator", formattedData,{
        headers:{
          Authorization: `Bearer ${user.token}`,
        }
      });
      if(response.status === 200){
        console.log(formattedData);
        handleCancel();
        onClose();
        toast.success("Operator added successfully");
        fetchOperators();
      }
        
    }catch(err){
      setError(err.message);
      setTimeout(() => setError(null), 3000);
      toast.error("Failed to add operator.Please try again!");
      console.log("Failed to add operator.",err);
    } 
  };

  //function to send edited data to the server
  const handleEditSubmit = async (e) => {
      e.preventDefault();
      const formattedEditData = {
          userName: formData.userName,
          password: formData.password,
          
      };
      try{
          setIsLoading(true);
          const response = await axios.put(`http://localhost:5000/api/users/operator/${selectedOperatorName}`,formattedEditData);
          console.log(selectedOperatorName)
          if(response.status === 200){
              toast.success(`${selectedOperatorName} updated successfully`);
          }
      }catch(err){
          toast.error("Failed to edit Operator. Please try again!");
          console.log(err)
      }finally{
          setIsLoading(false);
          onClose();
          onCloseEdit();
          fetchOperators();
      }
  }

   
  return (
    <form onSubmit={isEdit ? handleEditSubmit : handleSubmit} className="flex flex-col gap-4 justify-center items-center bg-white p-4 shadow-md rounded-md">
      <div className="flex flex-row justify-between items-center w-full">
        <h2 className="text-black font-semibold text-xl">
          {isEdit ? "Edit Operator Data" : "Add New Operator"}
        </h2>
        <img src={closeIcon} alt="close icon" className="w-4 h-4 cursor-pointer" 
          onClick={() => {
            onClose();
            onCloseEdit();
          }}
        />
      </div>
      {/* Reusable Input Fields */}
      <InputField
        inputRef={inputRef}
        label="User Name"
        placeholder="Enter User Name"
        value={formData.userName}
        onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
      />
      <InputField
        label="Password"
        placeholder="Enter Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      /> 
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

export default AddOperatorForm;