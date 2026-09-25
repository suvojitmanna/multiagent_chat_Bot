import api from "../../utils/axios";

export const createOrder = async (payload) => {
  try {
    const body = typeof payload === "string" ? { plan: payload } : payload;
    const { data } = await api.post(`/api/billing/create`, body);
    return data;
  } catch (err) {
    console.error("Error creating order:", err);
    return null;
  }
};
