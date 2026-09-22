import { getModel } from "../config/model.js"


export const chatAgent = async (state) => {
    const  llm=getModel("chat")
    const systemPrompt = `You are Shifra Ai, an intelligent AI assistant.
    `
    const response = await llm.invoke([
        {
            "role":"system",
            "content":systemPrompt
        },
        {
            "role": "human",
            "content": state.prompt
        }
    ])
    return {
        ...state,
        aiResponse:response.content
    }
    
}