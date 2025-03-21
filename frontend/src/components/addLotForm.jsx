import React,{ useState, useEffect} from 'react'
import { useAuth } from '../context/AuthContext';
import closeIcon from "../assets/icons8-close-48.png";
import InputField from './inputField';
import { toast } from 'react-toastify';
import axios from "axios";
import LoadingSpinner from './loadingSpinner';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

const AddLotForm = ({onClose, fetchLots, stock, isEdit, onCloseEdit}) => {
    const selectedLotName = stock?.lotName;
    const { user, backendURL } = useAuth();
    const [formData, setFormData] = useState({
        lotName: isEdit? stock?.lotName :"",
        farmerName:isEdit ? stock?.farmerName :"",
        vegetableName:isEdit ? stock?.vegetableName :"",
        numberOfBags:isEdit ? stock?.numberOfBags :"",
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
                const response = await axios.get(`${backendURL}/farmers`);
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
                const response = await axios.get(`${backendURL}/vegetables`);
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

    // Generate a 4-digit random number
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // Ensures a 4-digit number

    // Combine to form lotName
    const lotName = `${farmerShort?.toUpperCase()}-${vegetableShort?.toUpperCase()}-${formData.numberOfBags}-${randomNumber}`;

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
    // formatted data for submission
    const formattedData = {
      lotName: formData.lotName,
      farmerName: formData.farmerName,
      vegetableName: formData.vegetableName,
      numberOfBags: formData.numberOfBags,
      paymentStatus :formData.paymentStatus,
      amount:formData.amount,
      createdBy: user.userName
    };
      
    // Submit to API
    try{
      const response = await axios.post(`${backendURL}/stocks`, formattedData);
      if(response.status === 201){
        console.log(formattedData);
        handleCancel();
        onClose();
        toast.success("Lot added successfully");
        if(fetchLots) fetchLots();
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
      const formattedEditData = {
          lotName:formData.lotName,
          farmerName: formData.farmerName,
          vegetableName: formData.vegetableName,
          numberOfBags: formData.numberOfBags,
          paymentStatus :formData.paymentStatus,
          amount:formData.amount,
          modifiedBy: user.userName
          
      };
      try{
          setIsLoading(true);
          const response = await axios.put(`${backendURL}/stocks/${selectedLotName}`,formattedEditData);
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
    <form onSubmit={isEdit ? handleEditSubmit : handleSubmit} className="flex flex-col gap-3 justify-center items-center bg-white p-4 shadow-md rounded-md">
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
            <h1 className='text-[16px] font-medium text-black'>{formData.lotName.split('-').slice(0, 3).join('-')}</h1>
        )}
        {/* Input Fields */}
        <Autocomplete required
            className="bg-gray-300 rounded-md border-none focus:outline-none w-full"
            options={farmers && farmers.map(farmer => farmer.farmerName)}
            value={formData.farmerName}
            onChange={(event, newValue) => {
                setFormData({...formData,farmerName:newValue || ''});
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Farmer Name"
                    variant="outlined"
                    fullWidth
                    required
                    error={!formData.farmerName} // Shows error if empty
                    helperText={!formData.farmerName ? "Farmer name is required" : ""}
                />
            )}
        />
        <Autocomplete
            className="bg-gray-300 rounded-md border-none focus:outline-none w-full"
            options={vegetables && vegetables.map(vegetable => vegetable.vegetableName)}
            value={formData.vegetableName}
            onChange={(event, newValue) => {
                setFormData({...formData,vegetableName:newValue || ''});
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Vegetable Name"
                    variant="outlined"
                    fullWidth
                    required
                    error={!formData.vegetableName} // Shows error if empty
                    helperText={!formData.vegetableName ? "Vegetable name is required" : ""}
                />
            )}
        />
        <InputField
            label="Number of Bags"
            placeholder="Enter no.of bags"
            value={formData.numberOfBags}
            onChange={(e) => setFormData({ ...formData, numberOfBags: e.target.value })}
        />
        {!isEdit && (
            <div className='w-full'>
                <label className='text-gray-400 text-sm'>Payment Status</label>
                <select required className='w-full p-2 bg-[#d9d9d9] rounded-md' value={formData.paymentStatus}
                    onChange={(e) => setFormData({...formData, paymentStatus:e.target.value})}>
                    <option value="">Payment Status</option>
                    <option value="due">Due</option>
                    <option value="complete">Complete</option>
                </select>
            </div>
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