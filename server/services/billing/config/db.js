import mongoose from "mongoose"

const connectDb = async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}`);
        console.log("billing service is connected to the database");
    } catch (error) {
        console.log("Error in billing service database connection", error);
    }
}

export default connectDb