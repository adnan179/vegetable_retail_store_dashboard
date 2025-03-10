import React, { useEffect, useState } from 'react';
import closeIcon from "../assets/icons8-close-48.png"
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const DeletedSales = ({onClose}) => {
    const { backendURL } = useAuth();
    const [deletedSales, setDeletedSales] = useState([]);

  useEffect(() => {
    const fetchDeletedSales= async () => {
      try {
        const response = await axios.get(`${backendURL}/sales/deletedSales`);
        if(response.status === 200){
          setDeletedSales(response.data);
        }
      } catch(err){
        console.error(err);
      }
    };
    fetchDeletedSales();
  },[]);

  const handleUndo = async (sale) => {
    try{
        const response = await axios.post(`${backendURL}/sales/undo-delete/${sale.salesId}`);
        if(response.status === 200){
            setDeletedSales(deletedSales.filter((deletedSale) => deletedSale.salesId !== sale.salesId));
        }
    }catch(err){
        toast.error("Failed to restore sale");
        console.error("Undo delete error:", err.message);      
    }
  }

  return (
    <div className='flex flex-col bg-white p-5 rounded-lg gap-3'>
        <div className='flex flex-row justify-between items-center'>
            <h2 className='text-black font-semibold text-lg'>Deleted Sales</h2>
            <img 
                src={closeIcon} 
                alt='close' 
                className='w-6 h-6 object-contain cursor-pointer'
                onClick={() => onClose()}
            />
        </div>
              
        <table className='border-separate border '>
            <thead>
                <tr className="text-left text-[16px] text-black">
                <th className="border border-black p-2">Customer name</th>
                <th className="border border-black p-2">Lot name</th>
                <th className="border border-black p-2">Number of kgs</th>
                <th className="border border-black pl-2">Price per kg</th>
                <th className="border border-black pl-2">Payment Type</th>
                <th className="border border-black pl-2">Amount</th>
                <th className="border border-black pl-2">Deleted By</th>
                <th className="border border-black pl-2">Deleted At</th>
                <th className="border border-black p-2"></th>
                </tr>
            </thead>
            {deletedSales.length === 0 ? (
                <p className='text-lg font-medium text-red-500'>No deleted sales here</p>
            ):(
            <tbody className="text-[16px]">
                {deletedSales && deletedSales.map((sale) => (
                    <tr key={sale._id} className="text-left">
                        <td className="border border-black p-2 ">{sale.customerName}</td>
                        <td className="border border-black p-2 ">{sale.lotName.split('-').slice(0, 3).join('-')}</td>
                        <td className="border border-black p-2">{sale.numberOfKgs}</td>
                        <td className="border border-black p-2">{sale.pricePerKg}</td>
                        <td className="border border-black p-2">{sale.paymentType.split('-')[0]}</td>
                        <td className={`${sale.paymentType === "credit" ? "text-red-500":"text-green-500"} border border-black p-2 font-medium`}>{sale.totalAmount}</td>
                        <td className="border border-black p-2">{sale.deletedBy}</td>
                        <td className="border border-black p-2">{new Date(sale.deletedAt).toLocaleDateString()}</td>
                        <td className="border border-black p-2">
                            <button onClick={() => handleUndo(sale)} className="bg-green-500 text-white font-bold cursor-pointer px-4 py-2 rounded">
                                Undo
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
            )}
        </table>

    </div>
  )
}

export default DeletedSales