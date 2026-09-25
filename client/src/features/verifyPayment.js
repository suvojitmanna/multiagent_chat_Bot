import api from "../../utils/axios";

export const verifyPayment = async (payload) => {
  try {
    const { data } = await api.post(`/api/billing/verify`, payload);
    return data;
  } catch (err) {
    console.error("Error verifying payment:", err);
    return null;
  }
};
