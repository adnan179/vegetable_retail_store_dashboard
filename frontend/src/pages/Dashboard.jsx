import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Operators from '../components/operators';
import addIcon from "../assets/icons8-add-48 (1).png";
import AddLotForm from '../components/addLotForm';
import AddSalesForm from '../components/addSalesForm';
import SaleCards from '../components/saleCards';
import CreditCards from '../components/creditCards';
import EditCreditForm from "../components/editCreditForm";

const Dashboard = () => {
  const { user } = useAuth();
  const [isNewLot, setIsNewLot] = useState(false);
  const [isNewSale, setIsNewSale] = useState(false);
  const [isNewCredit, setIsNewCredit] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toDate, setToDate] = useState("");
  const [toTime, setToTime] = useState("");

  // Generate time slots in AM/PM format
  const generateTimeSlots = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      const formattedHour = hour % 12 || 12; // Convert 0 to 12 for AM/PM format
      const period = hour < 12 ? "AM" : "PM";
      times.push(`${formattedHour}:00 ${period}`);
    }
    return times;
  };

  const timeSlots = generateTimeSlots();

  return (
    <section className="flex flex-col w-[100%-110px] min-h-screen ml-[100px] p-5">
      <h1 className='font-medium text-lg'>Welcome {user.role && user.role}: {user.userName && user.userName}</h1>
      <div className='flex flex-row gap-3 mt-5'>
        {user.role === "admin" && <Operators />}
        
        <button onClick={() => setIsNewSale(true)} className='w-[200px] h-[200px] bg-green-500 rounded-md flex flex-col justify-center items-center text-white font-medium'>
          <img src={addIcon} alt='Add new sale' className='w-4 h-4 object-contain'/>
          <span>Add New Sale</span>
        </button>

        <button onClick={() => setIsNewLot(true)} className='w-[200px] h-[200px] bg-green-500 rounded-md flex flex-col justify-center items-center text-white font-medium'>
          <img src={addIcon} alt='Add new sale' className='w-4 h-4 object-contain'/>
          <span>Add New Lot</span>
        </button>
        <button onClick={() => setIsNewCredit(true)} className='w-[200px] h-[200px] bg-green-500 rounded-md flex flex-col justify-center items-center text-white font-medium'>
          <img src={addIcon} alt='Add new sale' className='w-4 h-4 object-contain'/>
          <span>Pay Jamalu</span>
        </button>
      </div>

      {/* Date and Time Filters */}
      <div className='flex flex-row gap-4 items-center mt-2'>
        <input type='date' value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-blue-400 text-white p-3 rounded-md"/>
        
        <select value={fromTime} onChange={(e) => setFromTime(e.target.value)} className="bg-blue-400 text-white p-3 rounded-md">
          <option value="">From Time</option>
          {timeSlots.map((time) => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>

        <input type='date' value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-blue-400 text-white p-3 rounded-md"/>
        
        <select value={toTime} onChange={(e) => setToTime(e.target.value)} className="bg-blue-400 text-white p-3 rounded-md">
          <option value="">To Time</option>
          {timeSlots.map((time) => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>
      </div>

      {/* credits and Sales Data Display */}
      <div className='flex flex-row gap-3 w-full mt-3'>
        <div className='w-[40%] max-h-[calc(100vh-350px)] overflow-auto'>
          <CreditCards
            fromDate={fromDate}
            fromTime={fromTime}
            toTime={toTime}
            toDate={toDate}
          />
        </div>
        <div className='w-[60%] max-h-[calc(100vh-350px)]'>
          <SaleCards 
            fromDate={fromDate}
            fromTime={fromTime}
            toTime={toTime}
            toDate={toDate}
          />
        </div>
      </div>

      {/* Add Lot Modal */}
      {isNewLot && (
        <div onClick={() => setIsNewLot(false)} className='flex w-full min-h-screen inset-0 fixed justify-center items-center bg-black/50'>
          <div onClick={(e) => e.stopPropagation()}>
            <AddLotForm 
              onClose={() => setIsNewLot(false)}
              onCloseEdit={() => setIsNewLot(false)}
            />
          </div>
        </div>
      )}

      {/* Add Sale Modal */}
      {isNewSale && (
        <div onClick={() => setIsNewSale(false)} className='flex w-full min-h-screen inset-0 fixed justify-center items-center bg-black/50'>
          <div onClick={(e) => e.stopPropagation()}>
            <AddSalesForm 
              onClose={() => setIsNewSale(false)}
              onCloseEdit={() => setIsNewSale(false)}
            />
          </div>
        </div>
      )}

      {isNewCredit && (
        <div onClick={() => setIsNewCredit(false)} className='flex w-full min-h-screen inset-0 fixed justify-center items-center bg-black/50'>
          
          <div onClick={(e) => e.stopPropagation()}>
            <EditCreditForm
              onClose={() => setIsNewCredit(false)}
              onCloseEdit={() => setIsNewCredit(false)}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default Dashboard;
