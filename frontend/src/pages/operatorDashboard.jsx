import React from 'react'
import { useAuth } from '../context/AuthContext';

const OperatorDashboard = () => {
    const { user } = useAuth();
  return (
    <section className="flex flex-col w-full min-h-screen ml-[100px] p-10">
        <h1>Welcome operator, {user.userName && user.userName}</h1>
    </section>
  )
}

export default OperatorDashboard