import React,{useState, useEffect} from 'react';
import axios from "axios";
import { toast } from 'react-toastify';
import AddGroupForm from '../components/addGroupForm';
import LoadingSpinner from '../components/loadingSpinner';
import { useAuth } from '../context/AuthContext';

const GroupPage = () => {
    const { backendURL } = useAuth()
    const [isFormOpen, setIsFormOpen] = useState(null);
    const [groups, setGroups] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchGroups();
    },[]);

    const fetchGroups = async () => {
        setIsLoading(true);
        try{
            const response = await axios.get(`${backendURL}/groups`);
            if(response.status === 200){
                setGroups(response.data);
                setError(null);
            }
        }catch(err){
            toast.error("Failed to fetch groups");
        }finally{
            setIsLoading(false);
        }
    };
    
    const handleDeleteGroup = async (groupName) => {
        setIsLoading(true);
        try{
            await axios.delete(`${backendURL}/groups/${groupName}`);
            toast.success("Group deleted successfully");
            fetchGroups();
        }catch(err){
            toast.error("Failed to delete group");
        }finally{
            setIsLoading(false);
        }
    };

  return (
    <section className="flex flex-col gap-5 w-full min-h-screen ml-[100px] p-5">
        <div>
            <button className="p-4 bg-green-500 text-white text-lg rounded-md shadow-sm font-medium" onClick={() => setIsFormOpen(true)}>
                Add New Group
            </button>
        </div>
        
        <table className="w-[50%] border-separate">
            <thead>
                <tr className="text-left text-[16px]">
                    <th className="border border-black p-2">group</th>
                    <th className="border border-black p-2"></th>
                </tr>
            </thead>
            {isLoading ? (
                <LoadingSpinner />
            ) : error ? (
                <div className="w-full h-full justify-center items-center">
                <p className="text-red-500 font-medium text-xl">{error}</p>
              </div>
            ):(
                <tbody>
                    {groups && groups.map(group =>(
                        <tr key={group._id}>
                            <td className="border border-black p-2">{group.groupName}</td>
                            <td className="border border-black p-2">
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteGroup(group.groupNname)
                                    }}
                                    className="text-[#D74848] font-bold cursor-pointer px-4 py-2 rounded bg-gray-200">
                                        Delete
                                    </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            )}  
        </table>
        {isFormOpen && (
          <div onClick={() => setIsFormOpen(false)} className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
            <AddGroupForm
                onClose={() => setIsFormOpen(false)}
                fetchGroups={fetchGroups}
            />
        </div>
        )}
    </section>
  )
}

export default GroupPage