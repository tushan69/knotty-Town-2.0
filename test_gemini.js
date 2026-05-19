import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyDPwx9VF8VzdcpuKgGmsBim9-0mi7ncX9w";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function run() {
  try {
    console.log("Sending request...");
    const result = await model.generateContent("Hi");
    console.log("Response:", await result.response.text());
  } catch (e) {
    console.error("Error calling Gemini API:");
    console.error(e);
  }
}

run();
