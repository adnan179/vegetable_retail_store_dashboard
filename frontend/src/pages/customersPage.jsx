import axios from 'axios';
import React, {useState,useEffect} from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/loadingSpinner';
import AddCustomerForm from '../components/addCustomerForm';
import { useAuth } from '../context/AuthContext';
import CustomersHistory from '../components/customersHistory';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

const CustomersPage = () => {
  const { backendURL } = useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customers,setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [villageNames, setVillageNames] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedVillage, setSelectedVillage] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [balanceSort, setBalanceSort] = useState("");
  const [isHistoryData, setIsHistoryData] = useState(false);

    
  useEffect(() =>{
    fetchCustomers();
  },[]);
    
  //function to fetch all customers
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${backendURL}/customers`);
        if (response.status === 200) {
          let data = response.data;

          setCustomers(data);
          setFilteredCustomers(data);

          const uniqueVillages = [...new Set(data.map(customer => customer.villageName))];
          const uniqueGroups = [...new Set(data.map(customer => customer.groupName))];

          setVillageNames(uniqueVillages);
          setGroups(uniqueGroups);
        }
    } catch (err) {
        setError("Error fetching Customers", err);
        console.log("Error fetching Customers", err);
    } finally {
        setIsLoading(false);
    }
  };
    
    
  //function to send farmer data to farmer form when clicked on edit button
  const handleEdit = (customer) => {
    setIsEdit(true);
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  }
    
  //function to filter data based on selected balance sort, village and group
  useEffect(() => {
    let filteredData = customers;
    if(selectedVillage){
      filteredData = filteredData.filter(customer => customer.villageName === selectedVillage);
    }
    if(selectedGroup){
      filteredData = filteredData.filter(customer => customer.groupName === selectedGroup);
    }

    //sort based on balance
    if (balanceSort === "lowToHigh"){
      filteredData.sort((a,b) => b.balance - a.balance);
    }else if ( balanceSort === "highToLow"){
      filteredData.sort((a,b) => a.balance - b.balance);
    }
    setFilteredCustomers(filteredData);
  },[selectedGroup,selectedVillage,customers, balanceSort]);

  //function to delete selected farmer when clicked on delete button
  const handleDelete = async (farmerName) => {
    setIsLoading(true);
    try{
      const response = await axios.delete(`${backendURL}/customers/${farmerName}`);
      if(response.status === 200){
        toast.success("Customer deleted successfully");
        fetchCustomers();
      }
    }catch(err){
      toast.error(`Error deleting customer: ${err.message}`);
      console.log("Error deleting customer",err);
    }finally{
      setIsLoading(false);
    }
  }

  return (
    <section className="flex flex-col w-full min-h-screen ml-[100px] p-5">
      {/* filters */}
      <div className="flex flex-row gap-5 text-lg">
        <Autocomplete
          className="mui-white-text w-[200px] rounded-md bg-blue-500"
          options={villageNames && villageNames.map((village) => village)} 
          value={selectedVillage || null} 
          onChange={(event, newValue) => {
            setSelectedVillage(newValue || null);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Village Name"
              variant="outlined"
              fullWidth
              className="mui-white-text"
            />
          )}
        />
        <Autocomplete
          className="mui-white-text w-[200px] rounded-md bg-blue-500"
          options={groups && groups.map((group) => group)} 
          value={selectedGroup || null} 
          onChange={(event, newValue) => {
            setSelectedGroup(newValue || null);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Group Name"
              variant="outlined"
              fullWidth
              className="mui-white-text"
            />
          )}
        />
        <select 
          value={balanceSort}
          onChange={(e) => setBalanceSort(e.target.value)}
          className="px-4 py-2 text-white rounded-md font-medium bg-blue-500 shadow-sm focus:ring-1 focus:ring-[#1E90FF] focus:outline-none"
        >
          <option value="">Sort by Balance</option>
          <option value="lowToHigh">Low to High</option>
          <option value="highToLow">High to Low</option>
        </select>
        <button 
          onClick={() => {
          setSelectedVillage("");
          setSelectedGroup("");
          setBalanceSort("");
        }} 
        className="px-4 py-2 rounded-md text-white font-medium bg-red-500 shadow-sm">
          Remove Filters
        </button>
        <button onClick={() => setIsFormOpen(true)} className="px-4 py-2 rounded-md text-white font-medium bg-green-600 shadow-sm">
          Add New Customer
        </button>
        <button onClick={() => setIsHistoryData(!isHistoryData)}
          className="px-4 py-2 rounded-md text-white font-medium bg-blue-500 shadow-sm">
          History
        </button>
      </div>
      {/* filters */}
      {/* table */}
      <table className="bg-white w-full mt-5 border-separate border border-black rounded-lg">
        <thead>
          <tr className="text-left text-[16px] text-black">
            <th className="border border-black p-2">Customer name</th>
            <th className="border border-black p-2">Village</th>
            <th className="border border-black pl-2">Phone number</th>
            <th className="border border-black pl-2">Group</th>
            <th className="border border-black pl-2">Balance</th>
            <th className="border border-black pl-2">Created By</th>
            <th className="border border-black pl-2">Created At</th>
            <th className="border border-black p-2"></th>
            <th className="border border-black p-2"></th>
          </tr>
        </thead>
        {isLoading ? (
          <LoadingSpinner />) : error ? (
            <div className="w-full h-full justify-center items-center">
              <p className="text-red-500 font-medium text-xl">{error}</p>
            </div>
          ):(
            <tbody className="text-[16px]">
              {filteredCustomers && filteredCustomers.map((customer) => (
                <tr key={customer._id} className="text-left">
                  <td className="border border-black p-2 ">{customer.customerName}</td>
                  <td className="border border-black p-2 ">{customer.villageName}</td>
                  <td className="border border-black p-2">{customer.phoneNumber}</td>
                  <td className="border border-black p-2">{customer.groupName}</td>
                  <td className="border border-black p-2 text-red-500 font-medium">{customer.balance}</td>
                  <td className="border border-black p-2">{customer.createdBy}</td>
                  <td className="border border-black p-2">{new Date(customer.createdAt).toLocaleString()}</td>
                  <td className="border border-black p-2">
                    <button onClick={() => handleEdit(customer)}className="bg-gray-200 text-[#1E90FF] font-bold cursor-pointer px-4 py-2 rounded">
                      Edit
                    </button>
                  </td>
                  <td className="border border-black p-2">
                    <button onClick={(e) =>{
                      e.stopPropagation();
                      handleDelete(customer.customerName);
                    }} className="text-[#D74848] font-bold cursor-pointer px-4 py-2 rounded bg-gray-200">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
      </table>
      {/* table */}
      {isFormOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
        <AddCustomerForm
          onClose={() => setIsFormOpen(false)}
          fetchCustomers={fetchCustomers}
          customer={selectedCustomer}
          isEdit={isEdit}
          onCloseEdit={() => setIsEdit(false)}
        />
      </div>
      )}
      {isHistoryData && (
          <div className='fixed inset-0 flex justify-center items-center bg-black/50 z-50'>
            <div className='w-3/4 max-w-2xl h-3/4 bg-white rounded-lg shadow-lg overflow-hidden'>
              <div className='h-full overflow-y-auto p-6'>
                <CustomersHistory onClose={() => setIsHistoryData(false)}/>
              </div>
            </div>
          </div>
        )}
    </section>
  )
}

export default CustomersPage