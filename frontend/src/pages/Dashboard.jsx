import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext';
import Operators from '../components/operators';
import addIcon from "../assets/icons8-add-48 (1).png"
import AddLotForm from '../components/addLotForm';
import AddSalesForm from '../components/addSalesForm';

const Dashboard = () => {
  const { user } = useAuth();
  const [isNewLot, setIsNewLot] = useState(false);
  const [isNewSale, setIsNewSale] = useState(false);

  return (
    <section className="flex flex-col w-full min-h-screen ml-[100px] p-5">
      <h1 className='font-medium text-lg'>Welcome {user.role && user.role}: {user.userName && user.userName}</h1>
      <div className='flex flex-row gap-3 mt-5'>
        {user.role && user.role === "admin" && (
          <Operators />
        )}
        <button onClick={() => setIsNewSale(true)} className='w-[200px] h-[200px] bg-[#1E90FF] rounded-md flex flex-col justify-center items-center text-white font-medium'>
          <img src={addIcon} alt='Add new sale' className='w-4 h-4 object-contain'/>
          <span>Add New Sale</span>
        </button>
        <button onClick={() => setIsNewLot(true)} className='w-[200px] h-[200px] bg-[#1E90FF] rounded-md flex flex-col justify-center items-center text-white font-medium'>
          <img src={addIcon} alt='Add new sale' className='w-4 h-4 object-contain'/>
          <span>Add New Lot</span>
        </button>
      </div>
      {isNewLot && (
        <div className='flex w-full min-h-screen inset-0 fixed justify-center items-center bg-black/50'>
          <AddLotForm 
            onClose={() => setIsNewLot(false)}
            onCloseEdit={() => setIsNewLot(false)}
          />
        </div>
        
      )}
      {isNewSale && (
        <div className='flex w-full min-h-screen inset-0 fixed justify-center items-center bg-black/50'>
          <AddSalesForm 
            onClose={() => setIsNewSale(false)}
            onCloseEdit={() => setIsNewSale(false)}
          />
        </div>
      )}
    </section>
  )
}

export default Dashboard;