export const imageGenAgent = async (state) => {
  console.log("--> Selected Agent: image");
  console.log("Image agent received prompt:", state?.prompt);
  return {
    ...state,
    aiResponse: "Image Agent executed. (Placeholder response)",
  };
};
