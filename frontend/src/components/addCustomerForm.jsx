import React,{ useState, useEffect, useRef} from 'react'
import { useAuth } from '../context/AuthContext';
import closeIcon from "../assets/icons8-close-48.png";
import InputField from './inputField';
import { toast } from 'react-toastify';
import axios from "axios";
import LoadingSpinner from './loadingSpinner';

const AddCustomerForm = ({onClose, fetchCustomers, customer, isEdit, onCloseEdit}) => {
    const selectedCustomerName = customer?.customerName;
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        customerName: isEdit? customer?.customerName :"",
        phoneNumber:isEdit ? customer?.phoneNumber :"",
        villageName:isEdit ? customer?.villageName :"",
        groupName:isEdit ? customer?.groupName :"",
    });
    const [groups, setGroups] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    //function to reset the form values
    const inputRef = useRef(null);

    //function to focus on the first input field in the form
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    //function to fetch groups
    useEffect(() => {
        const fetchgroups = async() => {
            try{
                const response = await axios.get("http://localhost:5000/api/groups");
                if(response.status === 200){
                    setGroups(response.data);
                    setError(null);
                }
            }catch(err){
                toast.error("Failed to fetch groups");
                setError(err.message);
            }
        }
        fetchgroups();
    },[])
    const handleCancel = () => {
        setFormData({
            customerName:"",
            phoneNumber:"",
            villageName:"",
            groupName:""
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
            customerName: formData.customerName,
            phoneNumber: formData.phoneNumber, 
            villageName: formData.villageName.toLowerCase(),
            groupName: formData.groupName.toLowerCase(),
            createdBy: `${user.userName}-${formattedTimestamp}`
        };
        
        // Submit to API
        try{
            const response = await axios.post("http://localhost:5000/api/customers", formattedData);
            if(response.status === 201){
                console.log(formattedData);
                handleCancel();
                onClose();
                toast.success("Customer added successfully");
                fetchCustomers();
            }
            
        }catch(err){
            setError(err.message);
            setTimeout(() => setError(null), 3000);
            toast.error("Failed to add Customer.Please try again!");
            console.log("Failed to add Customer.",err)
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
            customerName: formData.customerName,
            phoneNumber: formData.phoneNumber,
            villageName: formData.villageName.toLowerCase(),
            groupName: formData.groupName.toLowerCase(),
            modifiedBy: `${user.userName}-${formattedEditTimestamp}`
            
        };
        try{
            setIsLoading(true);
            const response = await axios.put(`http://localhost:5000/api/customers/${selectedCustomerName}`,formattedEditData);
            console.log(selectedCustomerName)
            if(response.status === 200){
                toast.success(`${selectedCustomerName} updated successfully`);
            }
        }catch(err){
            toast.error("Failed to edit Customer. Please try again!");
            console.log(err)
        }finally{
            setIsLoading(false);
            onClose();
            onCloseEdit();
            fetchCustomers();
        }
    }

   
  return (
    <form onSubmit={isEdit ? handleEditSubmit : handleSubmit} className="flex flex-col gap-4 justify-center items-center bg-white p-4 shadow-md rounded-md">
        <div className="flex flex-row justify-between items-center w-full">
            <h2 className="text-black font-semibold text-xl">
                {isEdit ? "Edit Customer Data" : "Add New Customer"}
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
        label="Customer Name"
        placeholder="Enter Customer Name"
        value={formData.customerName}
        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
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
      <select className='w-full p-2 bg-[#d9d9d9] rounded-md' onChange={(e) => setFormData({...formData, groupName:e.target.value})} value={formData.groupName}>
        <option value="">Group</option>
        {groups && groups.map(group => (
            <option key={group.groupName} value={group.groupName}>{group.groupName}</option>
        ))}
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

export default AddCustomerForm;