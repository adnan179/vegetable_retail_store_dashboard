import React,{ useState, useEffect, useRef} from 'react'
import closeIcon from "../assets/icons8-close-48.png";
import InputField from './inputField';
import { toast } from 'react-toastify';
import axios from "axios";
import LoadingSpinner from './loadingSpinner';
import { useAuth } from '../context/AuthContext';

const AddVegetableForm = ({onClose, fetchVegetables, vegetable, isEdit, onCloseEdit}) => {
    const { backendURL } = useAuth()
    const selectedVegetableName = vegetable?.vegetableName;
    
    const [formData, setFormData] = useState({
        vegetableName: isEdit? vegetable?.vegetableName :"",
        shortName:isEdit ? vegetable?.shortName :"",
    });
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    //function to reset the form values
    const handleCancel = () => {
        setFormData({
            vegetableName:"",
            shortName:"",
        });
    };

    //function to submit the form data to the server
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Submit to API
        const formattedData = {
            vegetableName:formData.vegetableName.toLowerCase(),
            shortName:formData.shortName.toLowerCase(),
        }
        try{
            const response = await axios.post(`${backendURL}/vegetables`, formattedData);
            if(response.status === 201){
                console.log(formattedData);
                handleCancel();
                onClose();
                toast.success("Vegetable added successfully");
                fetchVegetables();
            }
            
        }catch(err){
            toast.error("Failed to add Vegetable.Please try again!");
            console.log("Failed to add vegetable",err);
        } 
    };

    //fun to submit edited data to the server
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        
        try{
            setIsLoading(true);
            const response = await axios.put(`${backendURL}/vegetable/${selectedVegetableName}`,formData);
            console.log(selectedVegetableName)
            if(response.status === 200){
                toast.success(`${selectedVegetableName} updated successfully`);
            }
        }catch(err){
            toast.error("Failed to edit Vegetable. Please try again!");
            console.log(err)
        }finally{
            setIsLoading(false);
            onClose();
            onCloseEdit();
            fetchVegetables();
        }
    }

   
  return (
    <form onSubmit={isEdit ? handleEditSubmit : handleSubmit} className="flex flex-col gap-4 justify-center items-center bg-white p-4 shadow-md rounded-md">
        <div className="flex flex-row justify-between items-center w-full">
            <h2 className="text-black font-semibold text-xl">
                {isEdit ? "Edit Vegetable Data" : "Add New Vegetable"}
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
        label="Vegetable Name"
        placeholder="Enter Vegetable Name"
        value={formData.vegetableName}
        onChange={(e) => setFormData({ ...formData, vegetableName: e.target.value })}
      />
      <InputField
        label="Short Name"
        placeholder="Enter Short Name"
        value={formData.shortName}
        onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
      />
        
        <div className="flex flex-row gap-3">
            <button type="button" onClick={handleCancel} className="px-4 py-2 rounded text-white font-medium bg-[#D74848]">
                Cancel
            </button>
            <button type="submit" className="px-4 py-2 w-[200px] rounded text-white font-medium bg-[#1E90FF]">
                {isLoading ? <LoadingSpinner/>:"Submit"}
            </button>
        </div>
    </form>
  )
}

export default AddVegetableForm;