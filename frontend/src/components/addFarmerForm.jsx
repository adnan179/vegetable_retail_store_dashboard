import React,{ useState, useEffect, useRef} from 'react'
import { useAuth } from '../context/AuthContext';
import closeIcon from "../assets/icons8-close-48.png";
import InputField from './inputField';
import { toast } from 'react-toastify';
import axios from "axios";
import LoadingSpinner from './loadingSpinner';

const AddFarmerForm = ({onClose, fetchFarmers, farmer, isEdit, onCloseEdit}) => {
    const selectedFarmerName = farmer?.farmerName;
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        farmerName: isEdit? farmer?.farmerName :"",
        phoneNumber:isEdit ? farmer?.phoneNumber :"",
        villageName:isEdit ? farmer?.villageName :"",
        group:isEdit ? farmer?.group :"",
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    //function to reset the form values
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    const handleCancel = () => {
        setFormData({
            farmerName:"",
            phoneNumber:"",
            villageName:"",
            group:""
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Get current date and time
        const now = new Date();
        const formattedDate = now.toLocaleDateString("en-GB").replace(/\//g, "-"); // Formats as DD-MM-YY
        const formattedTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase(); // Formats as hh:mm am/pm

        // Combine for final format
        const formattedTimestamp = `${formattedDate}-${formattedTime}`;
        // formatted data for submission
        const formattedData = {
            farmerName: formData.farmerName,
            phoneNumber: formData.phoneNumber,
            villageName: formData.villageName.toLowerCase(),
            group: formData.group.toLowerCase(),
            createdBy: `${user.userName}-${formattedTimestamp}`
            
        };
        
        // Submit to API
        try{
            const response = await axios.post("http://localhost:5000/api/farmers", formattedData);
            if(response.status === 201){
                console.log(formattedData);
                handleCancel();
                onClose();
                toast.success("Farmer added successfully");
                fetchFarmers();
            }
            
        }catch(err){
            setError(err.message);
            setTimeout(() => setError(null), 3000);
            toast.error("Failed to add Farmer.Please try again!");
            console.log("Failed to add farmer.",err)
        } 
    };

    //function to send edited data to the server
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        
        // Get current date and time
        const now = new Date();
        const formattedEditDate = now.toLocaleDateString("en-GB").replace(/\//g, "-"); // Formats as DD-MM-YY
        const formattedEditTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase(); // Formats as hh:mm am/pm
        const formattedEditTimestamp = `${formattedEditDate}-${formattedEditTime}`;
        const formattedEditData = {
            farmerName: formData.farmerName,
            phoneNumber: formData.phoneNumber,
            villageName: formData.villageName.toLowerCase(),
            group: formData.group.toLowerCase(),
            modifiedBy: `${user.userName}-${formattedEditTimestamp}`
            
        };
        try{
            setIsLoading(true);
            const response = await axios.put(`http://localhost:5000/api/farmers/${selectedFarmerName}`,formattedEditData);
            console.log(selectedFarmerName)
            if(response.status === 200){
                toast.success(`${selectedFarmerName} updated successfully`);
            }
        }catch(err){
            toast.error("Failed to edit Farmer. Please try again!");
            console.log(err)
        }finally{
            setIsLoading(false);
            onClose();
            onCloseEdit();
            fetchFarmers();
        }
    }

   
  return (
    <form onSubmit={isEdit ? handleEditSubmit : handleSubmit} className="flex flex-col gap-4 justify-center items-center bg-white p-4 shadow-md rounded-md">
        <div className="flex flex-row justify-between items-center w-full">
            <h2 className="text-black font-semibold text-xl">
                {isEdit ? "Edit Farmer Data" : "Add New Farmer"}
            </h2>
            <img src={closeIcon} alt="close icon" className="w-4 h-4 cursor-pointer" 
            onClick={() => {
                onClose();
                onCloseEdit();
            }}/>
        </div>
        {/* Reusable Input Fields */}
      <InputField
        inputRef={inputRef}
        label="Farmer Name"
        placeholder="Enter Farmer Name"
        value={formData.farmerName}
        onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
      />
      <InputField
        label="Village Name"
        placeholder="Enter Village Name"
        value={formData.villageName}
        onChange={(e) => setFormData({ ...formData, villageName: e.target.value })}
      />
      <InputField
        label="Phone Number"
        placeholder="Enter Phone Number"
        value={formData.phoneNumber}
        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
      />
      <InputField
        label="Group"
        placeholder="Enter Group"
        value={formData.group}
        onChange={(e) => setFormData({ ...formData, group: e.target.value })}
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

export default AddFarmerForm