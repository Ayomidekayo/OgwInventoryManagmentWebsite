import React from 'react'
import { Outlet } from 'react-router-dom'
import SideBar from '../component/SideBar'

const Dashboard = () => {
  return (
    <div className='flex'>
        <SideBar />
        <div className='flex-1 ml-16  md:ml-64 bg-gray-100 min-h-screen '>
           <Outlet/>
        </div>
    </div>
  )
}

export default Dashboard