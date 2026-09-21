import api from "../../utils/axios.js";

const getCurrentUser = async () => {
  try {
    const { data } = await api.get("/api/me");
    console.log(data);
    return data;
  } catch (err) {
    if (err.response?.status === 401) {
      return null;
    }
    console.error("Error fetching current user:", err);
    return null;
  }
};

export default getCurrentUser;
