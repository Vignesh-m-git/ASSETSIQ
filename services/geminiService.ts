import { GoogleGenAI, Type } from "@google/genai";
import { AssetData } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey });

const SCHEMA_PROPERTIES = {
  "Asset Tag": { type: Type.STRING },
  "Block": { type: Type.STRING },
  "Floor": { type: Type.STRING },
  "Dept": { type: Type.STRING },
  "Brand": { type: Type.STRING },
  "Service Tag": { type: Type.STRING },
  "Computer Name": { type: Type.STRING },
  "Processor Type": { type: Type.STRING },
  "Processor Generation": { type: Type.STRING },
  "Processor Speed (GHz)": { type: Type.STRING },
  "RAM (GB)": { type: Type.STRING },
  "Hard Drive Type": { type: Type.STRING },
  "Hard Drive Size": { type: Type.STRING },
  "Graphics Card": { type: Type.STRING },
  "Operating System OS": { type: Type.STRING },
  "Operating System Architecture": { type: Type.STRING },
  "Operating System Version": { type: Type.STRING },
  "Windows License Key": { type: Type.STRING },
  "MS Office Version": { type: Type.STRING },
  "MS Office License Key": { type: Type.STRING },
  "Installed Applications": { type: Type.STRING },
  "Antivirus": { type: Type.STRING },
  "IP Address": { type: Type.STRING },
  "Remarks": { type: Type.STRING },
};

export const extractDataFromHtml = async (htmlContent: string, filename: string): Promise<AssetData[]> => {
  if (!apiKey) {
    throw new Error("Missing API Key");
  }

  const prompt = `
    Extract all IT Asset information from this HTML content.
    The HTML might be messy, contain nested tables, div layouts, or be a full webpage.
    Map values to the following fields exactly. 
    
    IMPORTANT RULE: If a field is missing, cannot be found, or is empty in the HTML, you MUST set the value to the string "nill". Do not leave it blank or null.

    Specific Extraction Rules:
    
    - Asset Tag: Leave blank (empty string), this will be filled by the filename in post-processing.
    
    - Brand: Extract the Manufacturer name found under the "System Model" section. 
      Example: "OptiPlex 3050 (Dell Inc.)" -> "Dell". "HP EliteDesk" -> "HP".
    
    - Service Tag: Extract the value labeled "System Serial Number". This is typically located under the "System Model" section in the HTML report.
    
    - RAM (GB): Extract only the rounded numeric value (e.g., "8", "16").
    - Hard Drive Size: Extract capacity with unit (GB/TB). e.g., "512 GB", "1 TB".
    
    - Processor Type: Extract only the processor family (e.g., "Intel Core i5"). Do NOT include specific model numbers (like "4590").
    - Processor Generation: Extract the numeric generation from the processor description.
      Look at the model number in the HTML (e.g. "i5-8500"). 
      Example mappings: "4590" -> "4th Gen", "6500" -> "6th Gen", "8250U" -> "8th Gen", "10500" -> "10th Gen", "12700" -> "12th Gen".
      Return format should be "Xth Gen".

    - Graphics Card: Remove suffixes like "[Display adapter]".

    - Operating System OS: Extract the Windows Edition. 
      Example: "Microsoft Windows 10 Pro" or "Microsoft Windows 11 Enterprise".

    - Operating System Architecture: Extract the bit architecture.
      Values should be "32bit" or "64bit". 
      Look for "x64-based PC", "64-bit", or similar indicators.

    - Operating System Version: Extract the version/build number.
      Example: "21H1", "22H2", "23H2" or build numbers like "10.0.19045".

    - Windows License Key: Extract the Product Key for the Operating System from the "Software Licenses" section.

    - MS Office Version: Look for the installed Microsoft Office version (e.g., "Microsoft Office 2016", "Microsoft Office 2019", "Microsoft Office 2021", "Microsoft 365").
      Return just the year or edition (e.g., "2019", "2021"). If not found, "nill".

    - MS Office License Key: Extract the Product Key for Microsoft Office from the "Software Licenses" section. If not found, "nill".

    - Installed Applications: Extract ONLY significant third-party user applications.
      Strictly EXCLUDE: Windows built-in apps, Microsoft Store apps, Drivers, Updates, Services.
      Remove version numbers.

    - Remarks: Analyze the asset for Cyber Security Compliance and Hardware Lifecycle.
      Logic:
      1. Processor Check:
         - If Processor is "Intel Pentium" -> "Critical" (Outdated processor).
         - If Processor is Core i3/i5/i7/i9 AND Generation is less than "10th Gen" -> "Bad" (No TPM support).
         - If Processor is Core i3/i5/i7/i9 AND Generation is "12th Gen" or higher -> "Good".
      2. OS Check:
         - If OS is Windows 7, 8, or XP -> "Critical".
         - If OS is Windows 10 (older than 21H1) -> "Bad".
      3. Antivirus Check:
         - If Antivirus is "nill" -> "Critical".
      
      Prioritize "Critical" over "Bad" over "Good".

    Fields required:
    Asset Tag, Block, Floor, Dept, Brand, Service Tag, Computer Name, 
    Processor Type, Processor Generation, Processor Speed (GHz), RAM (GB), 
    Hard Drive Type, Hard Drive Size, Graphics Card, 
    Operating System OS, Operating System Architecture, Operating System Version,
    Windows License Key, MS Office Version, MS Office License Key,
    Installed Applications, Antivirus, IP Address, Remarks.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: prompt },
        { text: htmlContent }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: SCHEMA_PROPERTIES,
            required: ["Computer Name"] 
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const rawData = JSON.parse(text) as AssetData[];

    const assetTagFromFilename = filename.replace(/\.[^/.]+$/, "");
    
    return rawData.map(item => ({
      ...item,
      "Asset Tag": assetTagFromFilename,
      "RAM (GB)": item["RAM (GB)"] ? item["RAM (GB)"].replace(/[^0-9.]/g, '') : "nill"
    }));

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};