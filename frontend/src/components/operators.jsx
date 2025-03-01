import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from './loadingSpinner';
import AddOperatorForm from './addOperator';
import addIcon1 from "../assets/icons8-add-48.png";

const Operators = () => {
  const {user} = useAuth()
  const [operators, setOperators] = useState(null);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditOperator, setIsEditOperator] = useState(false);
    

  useEffect(() => {
    fetchOperators()
  },[]);

  //func to fetch operators
  const fetchOperators = async() => {
    setIsLoading(true);
    try{
      const response = await axios.get("http://localhost:5000/api/users/operators",
        {
          headers:{
            authorization: `Bearer ${user.token}`
          },
        }
      );
      if(response.status === 200){
        setOperators(response.data);
      }
    }catch(err){
      toast.error("Error fetching operators",err.message);
      console.log("error fetching operators",err.message);
      console.log(user.token)
    }finally{
      setIsLoading(false);
    }
  };

  const handleEditSubmit = (user) => {
    setIsFormOpen(true);
    setIsEditOperator(true);
    setSelectedOperator(user);
  };

  const handleDelete = async (userName) => {
    setIsLoading(true);
    try{
      const response = await axios.delete(`http://localhost:5000/api/users/operator/${userName}`,{
        headers:{
          Authorization: `Bearer ${user.token}`
        }
      });
      if(response.status === 200){
        toast.success("Operator deleted successfully");
        fetchOperators();
        setIsLoading(false);
      }
    }catch(err){
      toast.error("Failed to delete operator",err.message);
      console.log("Failed to delete operator",err.message);
    }
  }
  return (
    <div className='flex flex-row gap-3'>
      {isLoading ? (
        <LoadingSpinner />
      ):(
        <>
          {user.role && user.role === 'admin' && (
            <table className='border border-black rounded-md border-separate'>
              <thead>
                <tr>
                  <th className='border border-black p-1'>User name</th>
                  <th className='border border-black p-1'>Role</th>
                  <th className='border border-black p-1'></th>
                  <th className='border border-black p-1'></th>
                </tr>
              </thead>
              <tbody>
                {operators && operators.map((op) => (
                  <tr key={op._id}>
                    <td className="border border-black p-2">{op.userName}</td>
                    <td className="border border-black p-2">{op.role}</td>
                    <td className="border border-black p-2">
                      <button onClick={() => handleEditSubmit(op)} className="bg-gray-200 text-[#1E90FF] font-bold cursor-pointer px-4 py-2 rounded">
                        Edit
                      </button>
                    </td>
                    <td className="border border-black p-2">
                      <button onClick={(e) =>{
                        e.stopPropagation();
                        handleDelete(op.userName);
                      }} className="text-[#D74848] font-bold cursor-pointer px-4 py-2 rounded bg-gray-200">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
      <div className='p-2 rounded-lg bg-white shadow flex w-[200px] h-[200px]'>
        <button onClick={() => setIsFormOpen(true)} className='w-full h-full rounded-md flex flex-col justify-center items-center bg-[#d9d9d9]'>
          <img src={addIcon1} alt="Add" className='w-6 h-6' />
          <span className='font-medium'>Add New Operator</span>
        </button>
      </div>
      {isFormOpen && (
        <div className='inset-0 fixed flex w-full h-screen bg-black/20 justify-center items-center z-50'>
          <AddOperatorForm 
            fetchOperators={fetchOperators}
            operator={selectedOperator}
            onClose={() => setIsFormOpen(false)}
            onCloseEdit={() => setIsEditOperator(false)}
            isEdit={isEditOperator}
          />
        </div>
        
      )}
    </div>
  )
}

export default Operators