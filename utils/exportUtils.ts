import ExcelJS from 'exceljs';
import { AssetData } from '../types';

const ORDERED_COLUMNS: (keyof AssetData)[] = [
  "Asset Tag",
  "Block",
  "Floor",
  "Dept",
  "Brand",
  "Service Tag",
  "Computer Name",
  "Processor Type",
  "Processor Generation",
  "Processor Speed (GHz)",
  "RAM (GB)",
  "Hard Drive Type",
  "Hard Drive Size",
  "Graphics Card",
  "Operating System OS",
  "Operating System Architecture",
  "Operating System Version",
  "Windows License Key",
  "MS Office Version",
  "MS Office License Key",
  "Installed Applications",
  "Antivirus",
  "IP Address",
  "Remarks"
];

const createWorkbookWithData = (data: AssetData[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Assets');

  // Set columns
  worksheet.columns = ORDERED_COLUMNS.map(col => ({
    header: col,
    key: col,
    width: 20 // Default width
  }));

  // Add rows
  worksheet.addRows(data);

  return workbook;
};

const triggerDownload = (blob: Blob, filename: string) => {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToXLSX = async (data: AssetData[], filename: string) => {
  const workbook = createWorkbookWithData(data);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, `${filename}.xlsx`);
};

export const exportToCSV = async (data: AssetData[], filename: string) => {
  const workbook = createWorkbookWithData(data);
  const buffer = await workbook.csv.writeBuffer();
  const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
};

export const exportToJSON = (data: AssetData[], filename: string) => {
  const jsonOutput = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonOutput], { type: 'application/json' });
  triggerDownload(blob, `${filename}.json`);
};