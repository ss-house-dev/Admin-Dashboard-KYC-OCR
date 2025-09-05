import axios from "axios";
import React, { useEffect, useState } from "react";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://141.11.156.52:3203",
  headers: { "Content-Type": "application/json" },
});

// แนบ token อัตโนมัติเวลามี
api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const TestUploader = () => {
  const [ocrResult, setOcrResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTestUpload = async () => {
    setOcrResult(null);
    setIsLoading(true);
    try {
      const response = await fetch("/idcard.jpg");
      const imageBlob = await response.blob();

      const imageFile = new File([imageBlob], "idcard.jpg", {
        type: imageBlob.type,
      });

      const formData = new FormData();
      formData.append("file", imageFile);

      alert("กำลังจะส่งไฟล์ทดสอบ...");
      const result = await axios.post("/ocr/idcard", formData);

      alert("อัปโหลดสำเร็จ!");
      console.log(result.data);

      console.log("API Response Data:", result.data);
      setOcrResult(result.data);
    } catch (error) {
      alert("อัปโหลดล้มเหลว! ดูที่ console");
      console.error("Test upload failed:", error);
    }
  };
};

export default TestUploader;

//get
axios
  .get("https://kyra-kyc.ddns.net/ocr/idcard")
  .then((res) => {
    console.log(res.data);
  })
  .catch((error) => {
    console.error(error);
  });
