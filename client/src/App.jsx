import React, { useEffect } from 'react'
import Home from "./pages/Home";
import getCurrentUser from './features/getCurrentUser';

const App = () => {

  useEffect(() => {
    const getUser = async () =>{
    await getCurrentUser();
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