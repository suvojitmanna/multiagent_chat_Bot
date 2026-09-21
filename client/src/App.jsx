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
    <div>
      <Home />
    </div>
  );
};

export default App;