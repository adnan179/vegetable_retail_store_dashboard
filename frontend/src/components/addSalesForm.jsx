import React,{ useState, useEffect} from 'react'
import { useAuth } from '../context/AuthContext';
import closeIcon from "../assets/icons8-close-48.png";
import InputField from './inputField';
import { toast } from 'react-toastify';
import axios from "axios";
import LoadingSpinner from './loadingSpinner';

const AddSalesForm = ({onClose, fetchSales, sale, isEdit, onCloseEdit}) => {
    const selectedSale = sale?.saleId;
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        salesId:"",
        customerName: isEdit? sale?.customerName :"",
        lotName: isEdit? sale?.lotName :"",
        numberOfKgs:isEdit ? sale?.numberOfKgs :"",
        pricePerKg:isEdit ? sale?.pricePerKg :"",
        kuli:isEdit ? sale?.kuli :false,
        paymentType : isEdit ? sale?.paymentType:"",
        totalAmount: isEdit ? sale?.totalAmount : 0,
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [customers, setCustomers] = useState(null);
    const [lots, setLots] = useState(null);

    //function to fetch customers data
    useEffect(() => {
        const fetchData =  async () => {
            try{
                const response = await axios.get("http://localhost:5000/api/customers");
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

    //function to fetch vegetables data
    useEffect(() => {
        const fetchData =  async () => {
            try{
                const response = await axios.get("http://localhost:5000/api/stocks");
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

        // Combine to form lotName
        const salesId = `${customerShort?.toUpperCase()}-${lotShort?.toUpperCase()}-${formattedDate}`;
        // Update formData with generated lotName
        setFormData({ ...formData, salesId:salesId });
    };

    // Auto-generate lotName when all required fields are filled
    useEffect(() => {
        generateSalesId();
    }, [formData.customerName, formData.lotName]);
    
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
            numberOfKgs:0,
            pricePerKg:0,
            paymentType:"",
            totalAmount:0,
            kuli:false
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
        const formattedData = {
            salesId:formData.salesId,
            customerName:formData.customerName,
            lotName: formData.lotName,
            numberOfKgs: formData.numberOfKgs,
            pricePerKg: formData.pricePerKg,
            kuli: formData.kuli,
            paymentType : formData.paymentType === 'jamalu' ? `jamalu-cred-${formData.salesId}`:formData.paymentType,
            totalAmount:formData.totalAmount,
            createdBy: `${user.userName}-${formattedTimestamp}`,
            creditId: formData.paymentType === 'jamalu' ? `cred-${formData.salesId}`:"",
        };
        
        // Submit to API
        try{
            const response = await axios.post("http://localhost:5000/api/sales", formattedData);
            if(response.status === 201){
                console.log(formattedData);
                handleCancel();
                onClose();
                toast.success("Sale added successfully");
                if(fetchSales) fetchSales();
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
        
        // Get current date and time
        const now = new Date();
        const formattedEditDate = now.toLocaleDateString("en-GB").replace(/\//g, "-"); // Formats as DD-MM-YY
        const formattedEditTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase(); // Formats as hh:mm am/pm
        const formattedEditTimestamp = `${formattedEditDate}-${formattedEditTime}`;
        const formattedEditData = {
            customerName:formData.customerName,
            lotName:formData.lotName,
            numberOfKgs: formData.numberOfKgs,
            pricePerKg: formData.pricePerKg,
            paymentType :formData.paymentType,
            totalAmount:formData.totalAmount,
            kuli:formData.kuli,
            modifiedBy: `${user.userName}-${formattedEditTimestamp}`
            
        };
        try{
            setIsLoading(true);
            const response = await axios.put(`http://localhost:5000/api/stocks/${selectedSale}`,formattedEditData);
            console.log(selectedSale)
            if(response.status === 200){
                toast.success(`${selectedSale} updated successfully`);
            }
        }catch(err){
            toast.error("Failed to edit Sale. Please try again!");
            console.log(err)
        }finally{
            setIsLoading(false);
            onClose();
            onCloseEdit();
            fetchSales();
        }
    }

   
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
        {formData.lotName && (
            <h1 className='text-[16px] font-medium text-black'>{formData.salesId}</h1>
        )}
        {/* Input Fields */}
        <select className='w-full p-2 bg-[#d9d9d9] rounded-md' value={formData.paymentType}
            onChange={(e) => setFormData({...formData, paymentType:e.target.value})}>
            <option value="">Payment Type</option>
            <option value="cash">Cash</option>
            <option value="jamalu">Jamalu</option>
        </select>
        {formData.paymentType && formData.paymentType === 'cash' ? (
            <InputField
                label="Customer Name"
                placeholder="Enter customer name"
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value })}
            />
        ):(
            <select className='w-full p-2 bg-[#d9d9d9] rounded-md' value={formData.customerName}
                onChange={(e) => setFormData({...formData,customerName:e.target.value})}>
                <option value="">Customer Name</option>
                {customers && customers.map((customer,idx) => (
                    <option key={idx} value={customer.customerName}>{customer.customerName}</option>
                ))}
            </select>
        )}
        
        <select className='w-full p-2 bg-[#d9d9d9] rounded-md' value={formData.lotName}
            onChange={(e) => setFormData({...formData,lotName:e.target.value})}>
            <option value="">Lot Name</option>
            {lots && lots.map((lot,idx) => (
                <option key={idx} value={lot.lotName}>{lot.lotName}</option>
            ))}
        </select>
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
        <select className='w-full p-2 bg-[#d9d9d9] rounded-md' value={formData.lotName}
            onChange={(e) => setFormData({...formData,lotName:e.target.value})}>
            <option value="">Kuli</option>
            <option value="true">true</option>
            <option value="false">false</option>
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

export default AddSalesForm;