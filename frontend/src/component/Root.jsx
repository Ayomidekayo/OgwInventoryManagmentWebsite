import React, { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom';
const Root = () => {
    const {user}=useAuth();
    const navigate=useNavigate();

    useEffect(()=>{

        if(user){

            //Check user role and navigate accordingly
            if(user.role==='admin'){
                 navigate('/admin-dashboard');
            }else if(user.role==='user'){
                navigate('/user-dashboard');
            }else{
                navigate('/login');
            }
        }else{
            navigate('/login');

        }
        console.log('Current User:', user);
    },[user,navigate]);
  return null;
}

export default Root