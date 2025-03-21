import React,{ useState, useEffect} from 'react'
import { useAuth } from '../context/AuthContext';
import closeIcon from "../assets/icons8-close-48.png";
import InputField from './inputField';
import { toast } from 'react-toastify';
import axios from "axios";
import LoadingSpinner from './loadingSpinner';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

const AddSalesForm = ({onClose, fetchSales, sale, isEdit, onCloseEdit}) => {
    const selectedSale = sale || {};
    const { user, backendURL } = useAuth();
    const initialFormData = {
        customerName: isEdit? sale?.customerName :"",
        lotName: isEdit? sale?.lotName :"",
        numberOfKgs:isEdit ? sale?.numberOfKgs :"",
        pricePerKg:isEdit ? sale?.pricePerKg :"",
        paymentType : isEdit ? sale?.paymentType:"",
        totalAmount: isEdit ? sale?.totalAmount : "",
    }
    const [formData, setFormData] = useState(() => {
        const savedData = sessionStorage.getItem("salesFormData");
        return savedData ? JSON.parse(savedData) : initialFormData;
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [customers, setCustomers] = useState(null);
    const [lots, setLots] = useState(null);

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

    //function to fetch stock data
    useEffect(() => {
        const fetchData =  async () => {
            try{
                const response = await axios.get(`${backendURL}/stocks`);
                if(response.status === 200){
                    const data = response.data;
                    const sortedData = data.sort((a,b) => a -b);
                    setLots(sortedData);
                }
            }catch(err){
                toast.error("Failed to fetch lot names");
                console.log("Failed to fetch lot names", err.message)
            }
        }
        fetchData();
    },[]);
    // Function to generate sales Id
    const generateSalesId = () => {
        if (!formData.customerName || !formData.lotName) {
            return;
        }

        // Extract first, middle, and last character from farmerName
        const customerShort = formData.customerName.length >= 3 
            ? `${formData.customerName[0]}${formData.customerName[Math.floor(formData.customerName.length / 2)]}${formData.customerName[formData.customerName.length - 1]}` 
            : formData.customerName;

        const lotShort = formData.lotName.slice(0,5);

        // Get current date (DDMMYY format)
        const date = new Date();
        const formattedDate = `${date.getDate()}${date.getMonth() + 1}${date.getFullYear().toString().slice(-2)}`;
        const randomNumber = Math.random(0,1000).toString().slice(2,5);

        // Combine to form lotName
        const salesId = `${customerShort?.toUpperCase()}-${lotShort?.toUpperCase()}-${formattedDate}-${randomNumber}`;
        // Update formData with generated lotName
        setFormData({ ...formData, salesId:salesId });
    };

    // Auto-generate lotName when all required fields are filled
    useEffect(() => {
        generateSalesId();
    }, [formData.customerName, formData.lotName, formData.numberOfKgs, formData.pricePerKg, formData.paymentType]);
    
    const generateAmount = () => {
        setFormData({...formData, totalAmount:(formData.numberOfKgs)*(formData.pricePerKg)})
    };
    useEffect(() => {
        generateAmount();
    },[formData.numberOfKgs,formData.pricePerKg]);
    //function to reset the form values
    const handleCancel = () => {
        setFormData({
            customerName:"",
            lotName:"",
            numberOfKgs:"",
            pricePerKg:"",
            paymentType:"",
            totalAmount:""
        });
        localStorage.removeItem("salesFormData");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formattedData = {
            salesId:formData.salesId,
            customerName:formData.customerName,
            lotName: formData.lotName,
            numberOfKgs: formData.numberOfKgs,
            pricePerKg: formData.pricePerKg,
            paymentType : formData.paymentType,
            totalAmount:formData.totalAmount,
            createdBy: user.userName
        };
        const prevFormData = {
            customerName:formData.customerName,
            lotName: formData.lotName,
            numberOfKgs: formData.numberOfKgs,
            pricePerKg: formData.pricePerKg,
            paymentType : formData.paymentType,
            totalAmount:0,
        };
        
        // Submit to API
        try{
            const response = await axios.post(`${backendURL}/sales`, formattedData);
            if(response.status === 201){
                console.log(formattedData);
                handleCancel();
                onClose();
                toast.success("Sale added successfully");
                console.log(formData);
                sessionStorage.setItem("salesFormData",JSON.stringify(prevFormData));
                fetchSales();
            }
            
        }catch(err){
            setError(err.message);
            setTimeout(() => setError(null), 3000);
            toast.error("Failed to add sale.Please try again!");
            console.log("Failed to add sale.",err)
        } 
    };

    //function to send edited data to the server
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const formattedEditData = {
            salesId:selectedSale.salesId,
            customerName:formData.customerName,
            lotName:formData.lotName,
            numberOfKgs: formData.numberOfKgs,
            pricePerKg: formData.pricePerKg,
            paymentType :formData.paymentType,
            totalAmount:formData.totalAmount,
            modifiedBy: user.userName
            
        };
        console.log(formattedEditData)
        try{
            setIsLoading(true);
            const response = await axios.put(`${backendURL}/sales/${selectedSale.salesId}`,formattedEditData);
            if(response.status === 200){
                toast.success(`${selectedSale.salesId} updated successfully`);
            }
        }catch(err){
            toast.error("Failed to edit Sale. Please try again!");
            console.log("failed to edit sale",err.message)
        }finally{
            setIsLoading(false);
            onClose();
            onCloseEdit();
            fetchSales();
        }
    };
 
  return (
    <form onSubmit={isEdit ? handleEditSubmit : handleSubmit} className="flex flex-col gap-4 justify-center items-center bg-white p-4 shadow-md rounded-md">
        <div className="flex flex-row justify-between items-center w-full">
            <h2 className="text-black font-semibold text-xl">
                {isEdit ? "Edit Sales Data" : "Add New Sales"}
            </h2>
            <img src={closeIcon} alt="close icon" className="w-4 h-4 cursor-pointer" 
            onClick={() => {
                onClose();
                onCloseEdit();
            }}/>
        </div>
        {sale && (
            <h1 className='text-[16px] font-medium text-black'>{sale.salesId}</h1>
        )}
        {/* Input Fields */}
        <select required className='w-full p-2 bg-[#d9d9d9] rounded-md' value={formData.paymentType}
            onChange={(e) => setFormData({...formData, paymentType:e.target.value})}>
            <option value="">Payment Type</option>
            <option value="cash">cash</option>
            <option value={sale?.paymentType.includes("credit") ? sale.paymentType : "credit"}>{sale?.paymentType.includes("credit") ? sale.paymentType : "credit"}</option>
        </select>
        {formData.paymentType && formData.paymentType === 'cash' ? (
            <InputField
                label="Customer Name"
                placeholder="Enter customer name"
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value })}
            />
        ):(
            <Autocomplete
                className="bg-gray-300 rounded-md w-full"
                options={customers && customers.map(customer => customer.customerName)}
                value={formData.customerName}
                onChange={(event, newValue) => {
                    setFormData({...formData,customerName:newValue || ''});
                }}
                renderInput={(params) => (
                    <TextField
                    {...params}
                    label="Customer Name"
                    variant="outlined"
                    fullWidth
                    required
                    error={!formData.customerName} // Shows error if empty
                    helperText={!formData.customerName ? "Customer name is required" : ""}
                    />
                )}
            />
        )}
        <Autocomplete
            className="bg-gray-300 rounded-md w-full"
            options={lots || []}
            getOptionLabel={(lot) => lot?.lotName?.split('-').slice(0, 3).join('-') || ''}
            value={lots?.find(lot => lot.lotName === formData.lotName) || null} // Ensures selected value
            onChange={(event, newValue) => setFormData({ ...formData, lotName: newValue?.lotName || '' })}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Lot Name"
                    variant="outlined"
                    fullWidth
                    required
                    error={!formData.lotName} // Shows error if empty
                    helperText={!formData.lotName ? "Lot name is required" : ""}
                />
            )}
        />

        <InputField 
            label="Number of Kgs"
            placeholder="Enter no.of Kgs"
            value={formData.numberOfKgs}
            onChange={(e) => setFormData({ ...formData, numberOfKgs: e.target.value })}
        />
        <InputField
            label="Price per KG"
            placeholder="Enter price per KG"
            value={formData.pricePerKg}
            onChange={(e) => setFormData({ ...formData, pricePerKg: e.target.value })}
        />
        <InputField 
            label="Amount"
            placeholder="Enter amount"
            value={formData.totalAmount}
            onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
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
};

export default AddSalesForm;