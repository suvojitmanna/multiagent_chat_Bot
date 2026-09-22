export const pptGenAgent = async (state) => {
  console.log("--> Selected Agent: ppt");
  console.log("PPT agent received prompt:", state?.prompt);
  return {
    ...state,
    aiResponse: "PPT Agent executed. (Placeholder response)",
  };
};
