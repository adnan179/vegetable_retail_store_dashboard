import React,{ useState, useEffect} from 'react'
import { useAuth } from '../context/AuthContext';
import closeIcon from "../assets/icons8-close-48.png";
import InputField from './inputField';
import { toast } from 'react-toastify';
import axios from "axios";
import LoadingSpinner from './loadingSpinner';

const AddLotForm = ({onClose, fetchLots, stock, isEdit, onCloseEdit}) => {
    const selectedLotName = stock?.lotName;
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        lotName: isEdit? stock?.lotName :"",
        farmerName:isEdit ? stock?.farmerName :"",
        vegetableName:isEdit ? stock?.vegetableName :"",
        numberOfBags:isEdit ? stock?.numberOfBags :0,
        paymentStatus : isEdit ? stock?.paymentStatus:"due",
        amount: isEdit ? stock?.amount : 0,
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [farmers, setFarmers] = useState(null);
    const [vegetables, setVegetables] = useState(null);

    //function to fetch farmers data
    useEffect(() => {
        const fetchData =  async () => {
            try{
                const response = await axios.get("http://localhost:5000/api/farmers");
                if(response.status === 200){
                    setFarmers(response.data);
                }
            }catch(err){
                toast.error("Failed to fetch farmers");
            }
        }
        fetchData();
    },[]);

    //function to fetch vegetables data
    useEffect(() => {
        const fetchData =  async () => {
            try{
                const response = await axios.get("http://localhost:5000/api/vegetables");
                if(response.status === 200){
                    setVegetables(response.data);
                }
            }catch(err){
                toast.error("Failed to fetch vegetables");
            }
        }
        fetchData();
    },[]);
    // Function to generate lot name
    const generateLotName = () => {
        if (!formData.farmerName || !formData.vegetableName || !formData.numberOfBags) {
            return;
        }

        // Extract first, middle, and last character from farmerName
        const farmerShort = formData.farmerName.length >= 3 
            ? `${formData.farmerName[0]}${formData.farmerName[Math.floor(formData.farmerName.length / 2)]}${formData.farmerName[formData.farmerName.length - 1]}` 
            : formData.farmerName;

        // Use vegetable's shortName if available, else fallback to first 3 characters
        const vegetableShort = vegetables?.find(veg => veg.vegetableName === formData.vegetableName)?.shortName;

        // Get current date (DDMMYY format)
        const date = new Date();
        const formattedDate = `${date.getDate()}${date.getMonth() + 1}${date.getFullYear().toString().slice(-2)}`;

        // Combine to form lotName
        const lotName = `${farmerShort?.toUpperCase()}-${vegetableShort?.toUpperCase()}-${formData.numberOfBags}-${formattedDate}`;
        // Update formData with generated lotName
        setFormData(prev => ({ ...prev, lotName }));
    };

    // Auto-generate lotName when all required fields are filled
    useEffect(() => {
        generateLotName();
    }, [formData.farmerName, formData.vegetableName, formData.numberOfBags]);
    
    //function to reset the form values
    const handleCancel = () => {
        setFormData({
            farmerName:"",
            vegetableName:"",
            numberOfBags:0,
            paymentStatus:"Due",
            amount:0,
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
            lotName: formData.lotName,
            farmerName: formData.farmerName,
            vegetableName: formData.vegetableName,
            numberOfBags: formData.numberOfBags,
            paymentStatus :formData.paymentStatus,
            amount:formData.amount,
            createdBy: `${user.userName}-${formattedTimestamp}`
            
        };
        
        // Submit to API
        try{
            const response = await axios.post("http://localhost:5000/api/stocks", formattedData);
            if(response.status === 201){
                console.log(formattedData);
                handleCancel();
                onClose();
                toast.success("Lot added successfully");
                fetchLots();
            }
            
        }catch(err){
            setError(err.message);
            setTimeout(() => setError(null), 3000);
            toast.error("Failed to add lot.Please try again!");
            console.log("Failed to add lot.",err)
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
            lotName:formData.lotName,
            farmerName: formData.farmerName,
            vegetableName: formData.vegetableName,
            numberOfBags: formData.numberOfBags,
            paymentStatus :formData.paymentStatus,
            amount:formData.amount,
            modifiedBy: `${user.userName}-${formattedEditTimestamp}`
            
        };
        try{
            setIsLoading(true);
            const response = await axios.put(`http://localhost:5000/api/stocks/${selectedLotName}`,formattedEditData);
            console.log(selectedLotName)
            if(response.status === 200){
                toast.success(`${selectedLotName} updated successfully`);
            }
        }catch(err){
            toast.error("Failed to edit lot. Please try again!");
            console.log(err)
        }finally{
            setIsLoading(false);
            onClose();
            onCloseEdit();
            fetchLots();
        }
    }

   
  return (
    <form onSubmit={isEdit ? handleEditSubmit : handleSubmit} className="flex flex-col gap-4 justify-center items-center bg-white p-4 shadow-md rounded-md">
        <div className="flex flex-row justify-between items-center w-full">
            <h2 className="text-black font-semibold text-xl">
                {isEdit ? "Edit Lot Data" : "Add New Lot"}
            </h2>
            <img src={closeIcon} alt="close icon" className="w-4 h-4 cursor-pointer" 
            onClick={() => {
                onClose();
                onCloseEdit();
            }}/>
        </div>
        {formData.lotName && (
            <h1 className='text-[16px] font-medium text-black'>{formData.lotName}</h1>
        )}
        {/* Input Fields */}
        <select className='w-full p-2 bg-[#d9d9d9] rounded-md' value={formData.farmerName}
            onChange={(e) => setFormData({...formData,farmerName:e.target.value})}>
            <option value="">Farmer Name</option>
            {farmers && farmers.map((farmer,idx) => (
                <option key={idx} value={farmer.farmerName}>{farmer.farmerName}</option>
            ))}
        </select>
        <select className='w-full p-2 bg-[#d9d9d9] rounded-md' value={formData.vegetableName}
            onChange={(e) => setFormData({...formData,vegetableName:e.target.value})}>
            <option value="">Vegetable Name</option>
            {vegetables && vegetables.map((vegetable,idx) => (
                <option key={idx} value={vegetable.vegetableName}>{vegetable.vegetableName}</option>
            ))}
        </select>
        <InputField
            label="Number of Bags"
            placeholder="Enter no.of bags"
            value={formData.numberOfBags}
            onChange={(e) => setFormData({ ...formData, numberOfBags: e.target.value })}
        />
        {!isEdit && (
            <InputField 
                label="Amount"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
        )}
        {!isEdit && (
            <select className='w-full p-2 bg-[#d9d9d9] rounded-md' value={formData.paymentStatus}
                onChange={(e) => setFormData({...formData, paymentStatus:e.target.value})}>
                <option value="">Payment Status</option>
                <option value="due">Due</option>
                <option value="complete">Complete</option>
            </select>
        )}
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

export default AddLotForm;