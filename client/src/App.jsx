import { signInWithPopup } from 'firebase/auth'
import React from 'react'
import { auth, googleProvider } from '../utils/firebase'
import api from '../utils/axios'

const App = () => {

  const handleLogin = async (token) => {
    try {
      const { data } = await api.post("/auth/login", { token })
      console.log(data.user)
    } catch (err) {
      console.log(err)
    }
  }

  const googleLogin = async () => {
    const data = await signInWithPopup(auth, googleProvider)
    const token = await data.user.getIdToken()
    console.log(token)
    await handleLogin(token)
    console.log(data);
  }

  return (
    <div>
      <button onClick={googleLogin}>Google Login</button>
    </div>
  )
}

export default App