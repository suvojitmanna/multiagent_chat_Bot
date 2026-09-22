export const pdfGenAgent = async (state) => {
  console.log("--> Selected Agent: pdf");
  console.log("PDF agent received prompt:", state?.prompt);
  return {
    ...state,
    aiResponse: "PDF Agent executed. (Placeholder response)",
  };
};
