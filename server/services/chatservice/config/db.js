import mongoose from "mongoose"

const connectDb = async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}`);
        console.log("chat service is connected to the database");
    } catch (error) {
        console.log("Error in chat service database connection", error);
    }
}

export default connectDb