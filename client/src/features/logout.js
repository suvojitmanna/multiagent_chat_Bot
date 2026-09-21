import api from "../../utils/axios.js";

const logout = async () => {
  try {
    const { data } = await api.get("/api/auth/logout");
    return data;
  } catch (error) {
    return error.response?.data;
  }
};

export default logout;
