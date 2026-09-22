export const codingGenAgent = async (state) => {
  console.log("--> Selected Agent: coding");
  console.log("Coding agent received prompt:", state?.prompt);
  return {
    ...state,
    aiResponse: "Coding Agent executed. (Placeholder response)",
  };
};
