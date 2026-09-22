import React, { useEffect } from 'react'
import Home from "./pages/Home";
import getCurrentUser from './features/getCurrentUser';
import { useDispatch } from 'react-redux'
import { setUserdata } from './redux/userSlice';

const App = () => {

  const dispatch = useDispatch()

  useEffect(() => {
    const getUser = async () =>{
    const data = await getCurrentUser();
    dispatch(setUserdata(data))
    }
    getUser()
  }, []);

  return (
    <div className="w-full h-full min-h-screen bg-[#0d0f14]">
      <Home />
    </div>
  );
};

export default App;