import xlsx, { WorkSheet } from "node-xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const parseXlsx = (fileName) => {
  try {
    const workSheetsFromFile = xlsx.parse(`${__dirname}/../${fileName}.xlsx`);

    return workSheetsFromFile[0].data;
  } catch (e) {
    return e;
  }
  // console.log(workSheetsFromFile.data[1]);

  // write the same file
};

export const buildXlsxFile = (filename: string, data: any[][]) => {
  const buffer = xlsx.build([{ name: filename, data } as WorkSheet]);
  const writeStream = fs.createWriteStream(
    `${__dirname}/../output/${filename}.xlsx`
  );
  writeStream.write(buffer);
  writeStream.close();
};
