import axios from 'axios';
import React, {useState,useEffect} from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/loadingSpinner';
import AddCustomerForm from '../components/addCustomerForm';
import { useAuth } from '../context/AuthContext';

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

          // Function to extract and convert date from createdBy
          const parseCreatedByDate = (createdBy) => {
            if (!createdBy) return null;
            
              const parts = createdBy.split("-");
              if (parts.length < 5) return null; // Ensure format is valid
              
              const [name, day, month, year, time] = parts;
              
              // Convert time to 24-hour format for Date parsing
              let [timeValue, period] = time.split(" ");
              let [hours, minutes] = timeValue.split(":").map(Number);

              if (period.toLowerCase() === "pm" && hours !== 12) {
                hours += 12;
              } else if (period.toLowerCase() === "am" && hours === 12) {
                hours = 0;
              }

              // Create a valid date object
              return new Date(`${year}-${month}-${day}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`);
            };

            // Sorting customers based on `createdBy` date extracted
            const sortedCustomers = data.sort((a, b) => {
              const dateA = parseCreatedByDate(a.createdBy) || new Date(0);
              const dateB = parseCreatedByDate(b.createdBy) || new Date(0);
              return dateB - dateA; // Sort in descending order (most recent first)
            });

          setCustomers(sortedCustomers);
          setFilteredCustomers(sortedCustomers);

          const uniqueVillages = [...new Set(sortedCustomers.map(customer => customer.villageName))];
          const uniqueGroups = [...new Set(sortedCustomers.map(customer => customer.groupName))];

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
      filteredData.sort((a,b) => a.balance - b.balance);
    }else if ( balanceSort === "highToLow"){
      filteredData.sort((a,b) => b.balance - a.balance);
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
        <select value={selectedVillage}
        onChange={(e) => setSelectedVillage(e.target.value)}
          className="px-4 py-2 text-white rounded-md font-medium bg-blue-400 shadow-sm focus:ring-1 focus:ring-[#1E90FF] focus:outline-none">
            <option value="">Village Name</option>
            {villageNames && villageNames.map((village,idx) => (
              <option key={idx} value={village}>
                {village}
              </option>
            ))}
        </select>
        <select value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="px-4 py-2 text-white rounded-md font-medium bg-blue-400 shadow-sm focus:ring-1 focus:ring-[#1E90FF] focus:outline-none">
            <option value="">Group</option>
            {groups && groups.map((group,idx) => (
              <option key={idx} value={group}>
                {group}
              </option>
            ))}
        </select>
        <select 
          value={balanceSort}
          onChange={(e) => setBalanceSort(e.target.value)}
          className="px-4 py-2 text-white rounded-md font-medium bg-blue-400 shadow-sm focus:ring-1 focus:ring-[#1E90FF] focus:outline-none"
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
            <th className="border border-black pl-2">Modified By</th>
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
                  <td className="border border-black p-2">{customer.modifiedBy ? customer.modifiedBy : ""}</td>
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
    </section>
  )
}

export default CustomersPage