import React,{ useState, useEffect, useRef} from 'react'
import closeIcon from "../assets/icons8-close-48.png";
import InputField from './inputField';
import { toast } from 'react-toastify';
import axios from "axios";
import LoadingSpinner from './loadingSpinner';

const AddGroupForm = ({onClose, fetchGroups}) => {
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    const [formData, setFormData] = useState({
        groupName:"",
    });
    const [isLoading, setIsLoading] = useState(false);
    //function to reset the form values
    const handleCancel = () => {
        setFormData({
            groupName:"",
        });
    };


    //function to submit group
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Submit to API
        const formattedData = {
            groupName:formData.groupName.toLowerCase(),
        }
        try{
            const response = await axios.post("http://localhost:5000/api/groups", formattedData);
            if(response.status === 201){
                console.log(formattedData);
                handleCancel();
                onClose();
                toast.success("Group added successfully");
                fetchGroups();
            }
            
        }catch(err){
            toast.error("Failed to add Group.Please try again!");
            console.log("Failed to add Group",err);
        }finally{
            setIsLoading(false);
        } 
    };

   
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 justify-center items-center bg-white p-4 shadow-md rounded-md">
        <div className="flex flex-row justify-between items-center w-full">
            <h2 className="text-black font-semibold text-xl">
                Add New Group
            </h2>
            <img src={closeIcon} alt="close icon" className="w-4 h-4 cursor-pointer" 
            onClick={() => {
                onClose();
            }}/>
        </div>
        {/* Reusable Input Fields */}
      <InputField
        inputRef={inputRef}
        label="Group Name"
        placeholder="Enter group Name"
        value={formData.groupName}
        onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
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

export default AddGroupForm;