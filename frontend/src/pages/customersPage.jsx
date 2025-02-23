import axios from 'axios';
import React, {useState,useEffect} from 'react';
import { toast } from 'react-toastify';

const CustomersPage = () => {
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

    
    useEffect(() =>{
        fetchCustomers();
      },[]);
    
      //function to fetch all customers
      const fetchCustomers = async () => {
        setIsLoading(true);
        try{
          const response = await axios.get("http://localhost:5000/api/customers");
          if(response.status === 200){
            const data = response.data;
            setCustomers(data);
            setFilteredCustomers(data);
    
            const uniqueVillages = [...new Set(data.map(customer => customer.villageName))];
            const uniqueGroups = [...new Set(data.map(customer => customer.group))];
    
            setVillageNames(uniqueVillages);
            setGroups(uniqueGroups);
          }
        }catch(err){
          setError("Error fetching Customers", err);
          console.log("Error fetching Customers",err);
        }finally{
          setIsLoading(false);
        }
      };
    
      //function to send farmer data to farmer form when clicked on edit button
      const handleEdit = (customer) => {
        setIsEdit(true);
        setSelectedCustomer(customer);
        setIsFormOpen(true);
      }
    
      //function to filter data based on selected village and group
      useEffect(() => {
        let filteredData = customers;
        if(selectedVillage){
          filteredData = filteredData.filter(customer => customer.villageName === selectedVillage);
        }
        if(selectedGroup){
          filteredData = filteredData.filter(customer => customer.group === selectedGroup);
        }
    
        setFilteredCustomers(filteredData);
      },[selectedGroup,selectedVillage,customers]);
    
      //function to delete selected farmer when clicked on delete button
      const handleDelete = async (farmerName) => {
        setIsLoading(true);
        try{
          const response = await axios.delete(`http://localhost:5000/api/customers/${farmerName}`);
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
        <div className="flex flex-row gap-5">
            <select value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
              className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
                <option value="">Village Name</option>
                {villageNames && villageNames.map((village,idx) => (
                  <option key={idx} value={village}>
                    {village}
                  </option>
                ))}
            </select>
            <select value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
                <option value="">Group</option>
                {groups && groups.map((group,idx) => (
                  <option key={idx} value={group}>
                    {group}
                  </option>
                ))}
            </select>
           <button 
              onClick={() => {
              setSelectedVillage("");
              setSelectedGroup("");
            }} 
           className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
              Remove Filters
            </button>
            <button onClick={() => setIsFormOpen(true)} className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
              Add New Customer
            </button>
        </div>
        {/* filters */}
    </section>
  )
}

export default CustomersPage