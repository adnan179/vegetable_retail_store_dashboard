import React,{useState, useEffect} from 'react'
import LoadingSpinner from '../components/loadingSpinner';
import axios from "axios";
import { toast } from 'react-toastify';
import AddVegetableForm from '../components/addVegetableForm';
import { useAuth } from '../context/AuthContext';

const VegetablesPage = () => {
  const { backendURL } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vegetables, setVegetables] = useState(null);
  const [selectedVegetable, setSelectedVegetable] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    fetchVegetables();
  }, []);
  const fetchVegetables = async () => {
    setIsLoading(true);
    try{
      const response = await axios.get(`${backendURL}/vegetables`);
      if(response.status === 200){
        setVegetables(response.data);
        setError(null)
      }
    }catch(err){
      toast.error("Failed to fetch vegetables",err.message)
      setError(err.message);
    }finally{
      setIsLoading(false);
    }
  };

  const handleEdit = (vegetable) => {
    setIsEdit(true);
    setSelectedVegetable(vegetable);
    setIsFormOpen(true);
  }

  const handleDelete = async (vegetableName) => {
    setIsLoading(true);
    try{
      const response = await axios.delete(`${backendURL}/vegetables/${vegetableName}`);
      if(response.status === 200){
        toast.success("Vegetable deleted successfully");
        fetchVegetables();
      }
    }catch(err){
      toast.error(`Error deleting vegetable: ${err.message}`);
      console.log("Error deleting vegetable",err);
    }finally{
      setIsLoading(false);
    }
  }

  return (
    <section className="w-full min-h-screen flex flex-col ml-[100px] p-5">
      <button className="p-4 bg-green-500 flex w-[200px] justify-center items-center text-lg rounded-md text-white font-medium"
      onClick={() => setIsFormOpen(true)}>
        Add New vegetable
      </button>
      <table className="w-[70%] mt-5 border-separate">
        <thead>
          <tr className="text-left text-[16px] text-black">
            <th className="border border-black p-2">Vegetable name</th>
            <th className="border border-black p-2">Short name</th>
            <th className="border border-black p-2"></th>
            <th className="border border-black p-2"></th>
            </tr>
        </thead>
          {isLoading ? (
            <LoadingSpinner /> ) : error ? (
              <div className="flex w-full h-full items-center">
                <p className="text-red-500 font-medium text-xl">{error}</p>
              </div>
            ) : (
              <tbody className="text-[16px]">
                {vegetables && vegetables.map((vegetable) => (
                  <tr key={vegetable._id} className="text-left">
                    <td className="border border-black p-2 ">{vegetable.vegetableName}</td>
                    <td className="border border-black p-2 ">{vegetable.shortName}</td>
                    <td className="border border-black p-2">
                      <button onClick={() => handleEdit(vegetable)}className="bg-gray-200 text-[#1E90FF] font-bold cursor-pointer px-4 py-2 rounded">
                        Edit
                      </button>
                    </td>
                    <td className="border border-black p-2">
                      <button onClick={(e) =>{
                        e.stopPropagation();
                        handleDelete(vegetable.vegetableName);
                      }} className="text-[#D74848] font-bold cursor-pointer px-4 py-2 rounded bg-gray-200">
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
          <div onClick={(e) => e.stopPropagation()}>
            <AddVegetableForm 
              onClose={() => setIsFormOpen(false)}
              fetchVegetables={fetchVegetables}
              vegetable={selectedVegetable}
              isEdit={isEdit}
              onCloseEdit={() => setIsEdit(false)}
            />
          </div>
          
        </div>
      )}
    </section>
  )
}

export default VegetablesPage;