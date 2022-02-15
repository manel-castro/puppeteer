import xlsx from "xlsx";
import fs from "fs";
import { buildXlsxFile, parseXlsx } from "./excel-functions";

/*
+++ TODOS +++

1. Get all data from distribution tables for MH
    - Pay attention to: NHC with more than one intervention (name/last name will have a 2 at the end)
    - If some observation is lost input it manually
2. Get inputs to understandable way: 
    - ALL DATES to JS format
    -  
3. 


** Values that don't exist, ask first why. 
** Can they be interpolated? 



*/

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const parseXlsx2 = (fileName: string, sheetName: string) => {
  try {
    const workSheetsFromFile = xlsx.readFile(
      `${__dirname}/../${fileName}.xlsx`,
      { cellText: false, cellDates: true }
    ).Sheets[sheetName];

    const res = xlsx.utils.sheet_to_json(workSheetsFromFile, {
      dateNF: 'dd"."mm"."yyyy',

      blankrows: false,
    });

    return res;
  } catch (e) {
    return e;
  }

  // write the same file
};

export const buildXlsxFile2 = (
  filename: string,
  JsonArray: any[],
  dirName = "output"
) => {
  var XLSX = xlsx;
  var workSheet = XLSX.utils.json_to_sheet(JsonArray);

  var wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, workSheet, filename);

  xlsx.writeFile(wb, `${dirName}/${filename}.xlsx`);
};

export const addDaysTo1Jan1900 = (days: number) => {
  // used for computing xlsx days

  const date = new Date(1900, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

export const getJsFormatFromOddDate = (dateOddFormat: string) => {
  // dateOddFormat of type: dd/mm/yy
  const dayMonthYear = dateOddFormat.split("/");
  const day = parseInt(dayMonthYear[0]) + 1;
  const month = parseInt(dayMonthYear[1]) - 1;
  const year = parseInt(dayMonthYear[2]);
  return new Date(year, month, day);
};

export const TransformJSToXlsxDateFormat = (dateJSFormat: Date) => {
  const dateXlsxReference = new Date(1900, 0, 0);
  const differenceInTime = dateJSFormat.getTime() - dateXlsxReference.getTime();
  const daysFrom1900 = differenceInTime / (1000 * 3600 * 24);
  return Math.round(daysFrom1900);
};

export const TransformXlsxToJSDateFormat = (xlsxDate: number | string) => {
  if (typeof xlsxDate === "string") xlsxDate = parseInt(xlsxDate);

  const xlsxDateInJs = addDaysTo1Jan1900(xlsxDate);

  const Day = xlsxDateInJs.getDay();
  const Month = xlsxDateInJs.getMonth();
  const Year = xlsxDateInJs.getFullYear();

  return `${Day}/${Month}/${Year}`;
};

export const searchInDDBBforNHCandDate = (
  ddbbData: any[],
  nhc: string,
  data: Date
) => {
  const dateToFind = TransformJSToXlsxDateFormat(data);

  for (let j = 0; j < ddbbData.length; j++) {
    const currentDdbbRow = ddbbData[j];

    const ddbbDataHep = currentDdbbRow[HEADERS_LIVER_DDBB.DATAHEP];
    const ddbbDataNHC = currentDdbbRow[HEADERS_LIVER_DDBB.SAP];

    if (ddbbDataNHC === nhc) {
      if (ddbbDataHep == dateToFind) {
        return currentDdbbRow;
      }
    }

    // if (dddbbLAST1 === filteredLAST1) {
    //   // console.log("currentDDBBROW: ", currentDdbbRow);

    //   occurrences.push(currentDdbbRow);
    // }
  }
};

(async () => {
  return;
  // get all DDBB data
  const ddbbData = await parseXlsx2(
    "assets/dataPlaOnco2019-2020",
    "PlaOnco2019-2020"
  );

  // get filtered data
  const filteredData = await parseXlsx2("assets/MH_FETGE", "Sheet1");

  // // days after January 0, 1900
  // ddbbData.forEach((item) => {
  //   const dataHepInXlsx = item[headersDdbb.DATAHEP];

  //   const date = addDaysTo1Jan1900(dataHepInXlsx);
  //   console.log(date);
  // });

  // console.log(filteredData.map((item) => item[headerFilteredData.NHC]));
  // console.log(ddbbData.map((item) => item[headersDdbb.SAP]));

  // console.log(filteredData.length);

  // const regExp = new RegExp("[0-9]");
  // const test = "ñalskjfd 10/02/21";

  // const matchIndex = test.match(regExp).index;

  // // data format on ddbb 03-Jul-20

  // const data = test.slice(matchIndex, test.length);

  // console.log(data.slice(data.length - 2, data.length));
  // console.log(data);

  const crossedArray = [];
  const crossedArraySAP = [];

  // for (let i = 0; i < ddbbData.length; i++) {
  //   const currentDdbbRow = ddbbData[i];
  //   if (currentDdbbRow[headersDdbb.SAP] == "251947") console.log("occurrence");
  // }
  // console.log("next");

  // Seems like SAP / NHC numbers are not crossing right. Check DDBB.
  // Try to parse by LAST1 in case occurrences > 1 keep crossing > Last2 and > Name

  // const NHCSfiltered = [];
  // const NHCSddbb = [];
  // for (let i = 0; i < filteredData.length; i++) {
  //   const currentFilteredRow = filteredData[i];
  //   const filteredNHC = currentFilteredRow[headerFilteredData.NHC];

  //   NHCSfiltered.push(filteredNHC);
  // }

  // for (let j = 0; j < ddbbData.length; j++) {
  //   const currentDdbbRow = ddbbData[j];

  //   const ddbbDataNHC = currentDdbbRow[headersDdbb.SAP];
  //   NHCSddbb.push(ddbbDataNHC);
  // }
  // console.log("NHCSfiltered", NHCSfiltered.length);
  // console.log("NHCSddbb", NHCSddbb.length);

  for (let i = 0; i < filteredData.length; i++) {
    // continue;
    const currentFilteredRow = filteredData[i];
    const filteredNHC = currentFilteredRow[headerFilteredData.NHC];
    // const filteredLAST1 = currentFilteredRow[headerFilteredData.LAST1];
    // const filteredLAST2 = currentFilteredRow[headerFilteredData.LAST2];

    let occurrencesSAP = [];
    const _tempOcurrenceFilteredSAP = []; // used in case more than one occurrence
    const exactConicidence = [];
    for (let j = 0; j < ddbbData.length; j++) {
      const currentDdbbRow = ddbbData[j];

      const ddbbDataNHC = currentDdbbRow[HEADERS_LIVER_DDBB.SAP];
      const dddbbLAST1 = currentDdbbRow[HEADERS_LIVER_DDBB.APELLIDO1];

      if (ddbbDataNHC === filteredNHC) {
        occurrencesSAP.push(currentDdbbRow);
        _tempOcurrenceFilteredSAP.push(currentFilteredRow);
      }
      // if (dddbbLAST1 === filteredLAST1) {
      //   // console.log("currentDDBBROW: ", currentDdbbRow);

      //   occurrences.push(currentDdbbRow);
      // }
    }

    if (occurrencesSAP.length > 1) {
      for (let x = 0; x < occurrencesSAP.length; x++) {
        const ocurrencesRow = occurrencesSAP[x];
        const _tempOcurrenceFilteredSAPRow = _tempOcurrenceFilteredSAP[x];

        // CASUISTIC 1: IT IS DUPLICATED IN FILTERED DATA
        // const _tempOccFilteredComment = _tempOcurrenceFilteredSAPRow[
        //   headerFilteredData.COMMENT
        // ] as string;

        const regExp = new RegExp("[0-9]");

        // const matchIndex = _tempOccFilteredComment.match(regExp)?.index;

        // data format on ddbb 03-Jul-20

        // if (!matchIndex) {
        //   crossedArraySAP.push(ocurrencesRow);

        //   occurrencesSAP.splice(x, 1);

        //   continue;
        // }
        // const data = _tempOccFilteredComment.slice(
        //   matchIndex,
        //   _tempOccFilteredComment.length
        // );
        // console.log("data is: ", data);

        // checking malformatted data: works right
        // if (data.includes(" y ")) {
        //   const [data1, data2] = data.split(" y ");

        //   const daysJSFormatDate1 = getJsFormatFromOddDate(data1);
        //   const MultipleYVal1 = searchInDDBBforNHCandDate(
        //     occurrencesSAP,
        //     filteredNHC,
        //     daysJSFormatDate1
        //   );
        //   const daysJSFormatDate2 = getJsFormatFromOddDate(data2);
        //   const MultipleYVal2 = searchInDDBBforNHCandDate(
        //     occurrencesSAP,
        //     filteredNHC,
        //     daysJSFormatDate2
        //   );

        //   if (MultipleYVal1) crossedArraySAP.push(MultipleYVal1);
        //   if (MultipleYVal2) crossedArraySAP.push(MultipleYVal2);

        //   // occurrencesSAP.slice(x, 1);

        //   x = occurrencesSAP.length;
        //   occurrencesSAP = [];
        //   continue;

        //   // --- Check values are right
        //   // console.log("date1", TransformJSToXlsxDateFormat(daysJSFormatDate1));

        //   // console.log("foundValue1", foundValue1);
        //   // console.log("date2", TransformJSToXlsxDateFormat(daysJSFormatDate2));
        //   // console.log("foundValue2", foundValue2);
        // }

        // one specific observation is bad formatted and both dates are specified on other date
        // if (data.includes(")")) {
        //   crossedArraySAP.push(ocurrencesRow);
        //   occurrencesSAP.splice(x, 1);
        //   continue;
        // }

        // const JSData = getJsFormatFromOddDate(data);
        const dataDownwardsThereshold = new Date(2019, 0, 1);
        const dataUpwardsThereshold = new Date(2020, 11, 31);

        // filter out of year variables
        // if (
        //   JSData.getTime() > dataDownwardsThereshold.getTime() ||
        //   JSData.getTime() < dataUpwardsThereshold.getTime()
        // ) {
        //   // console.log("happened out of range");
        //   // console.log(
        //   //   `occurrencesBefore on index ${x}: ${occurrencesSAP.length}`
        //   // );

        //   occurrencesSAP.splice(x, 1); // check if it works
        //   continue;
        //   // console.log(
        //   //   `occurrences after on index ${x}: ${occurrencesSAP.length}`
        //   // );
        //   // x = occurrencesSAP.length;
        // }

        // data (format dd/mm/yy) === DATAHEP (format days from 1/1/1900)
        // const dataHepFromFilteredComment =

        // get xlsx data in JS format
        // const dataHepInXlsx = item[headersDdbb.DATAHEP];

        // const dataHepJSFormat = addDaysTo1Jan1900(dataHepInXlsx);

        // if(dataHepJSFormat === )

        // CASUISTIC 2: IT IS DUPLICATED IN DDBB (NAME AND LAST NAMES HAVE A 2)

        // const occurrenceLAST2 = ocurrencesRow[headersDdbb.APELLIDO2];
        // if (occurrenceLAST2 === filteredLAST2) {
        //   occurrences.filter(
        //     (occurrence) => occurrence[headersDdbb.APELLIDO2] !== filteredLAST2
        //   );
        // }
        // console.log(currentDdbbRow);
      }
    }

    // if (occurrencesSAP.length === 1) {
    crossedArraySAP.push(...occurrencesSAP);
    // } else if (occurrencesSAP.length === 0) {
    // } else {
    //   console.error(
    //     "More than one occurrence left when pushing to crossed array"
    //   );
    //   throw new Error(
    //     "More than one occurrence left when pushing to crossed array"
    //   );
    // }
  }

  console.log(JSON.stringify(crossedArraySAP, null, 2));

  // const data = [
  //   [1, 2, 3],
  //   [true, false, null, "sheetjs"],
  //   ["foo", "bar", new Date("2014-02-19T14:30Z"), "0.3"],
  //   ["baz", null, "qux"],
  // ];

  // crossedArraySAP.unshift(ddbbData[0]);
  buildXlsxFile2("crossedData3", crossedArraySAP);

  // console.log(.length);
  // console.log(JSON.stringify(crossedArray, null, 2));

  // filteredData;

  //   const relevantData = ddbbData.filter(item => item)
})();

const headerFilteredData = {
  NHC: "NHC",
  NAME: "NOM",
  LAST1: "C1",
  LAST2: "C2",
  TYPE: "TIPUS",
  COMMENT: "__EMPTY",
};

export const checkVariables = [
  "TECNICA",
  "COMITE",
  "ASA",
  "DATAIQCOLON",
  "EPPO",
  "DATAHEP",
  "ESTADA",
  "RESMAY_MEN_ampli",
  "VIAACCES",
  "RF",
  "mw",
  "ValRcir",
  "NMETIMAGpre",
  "MIDAMHIMATGE",
  "BILOBUL",
  "RES2",
  "RES3",
  "CIRSIMCOLON",
  "GRAUCLAVIEN",
  "CCIndex",
  "NMETAP",
  "MIDAAP",
  "MARGEN",
  "INVMARG",
  "DATAULTCONT",
  "ALPSS",
  "INSUFHEPisgls",
  "ESTAT",
  "FISTBILI",
  "GrauIH",
  "INFESPAI",
  "HEMOPER",
  "ASCITIS",
  "REIQ",
  "HEMOPER",
  "RECHEP",
  "RECPUL",
  "DataEXITUS",
];

type CheckVarCondType = {
  name: string;
  condition?: string; // ?????
};

// export const checkVariablesCond:CheckVarCondType[] = [
//   { name: "TECNICA"},
//   { name: "COMITE"},
//   { name: "ASA"},
//   { name: "DATAIQCOLON"},
//   { name: "EPPO"},
//   "DATAHEP",
//   "ESTADA",
//   "RESMAY_MEN_ampli",
//   "VIAACCES",
//   "RF",
//   "mw",
//   "ValRcir",
//   "NMETIMAGpre",
//   "MIDAMHIMATGE",
//   "BILOBUL",
//   "RES2",
//   "RES3",
//   "CIRSIMCOLON",
//   "GRAUCLAVIEN",
//   "CCIndex",
//   "NMETAP",
//   "MIDAAP",
//   "MARGEN",
//   "INVMARG",
//   "DATAULTCONT",
//   "ALPSS",
//   "INSUFHEPisgls",
//   "ESTAT",
//   "FISTBILI",
//   "GrauIH",
//   "INFESPAI",
//   "HEMOPER",
//   "ASCITIS",
//   "REIQ",
//   "HEMOPER",
//   "RECHEP",
//   "RECPUL",
//   "DataEXITUS",
// ];

export const HEADERS_LIVER_DDBB = {
  FECHA1RCMD: "Fecha 1r CMD",
  FECHAULTCMD: "Fecha ult. CMD",
  FECHATACRM: "Fecha TAC-RM",
  LOCTUMOR: "Loc. Tumor",
  TECNICA: "TECNICA",
  NUM_RESEC: "NUM_RESEC",
  NUM_PAC: "NUM_PAC",
  NOMBRE: "NOMBRE",
  APELLIDO1: "APELLIDO1",
  APELLIDO2: "APELLIDO2",
  SAP: "SAP",
  COMITE: "COMITE",
  SEXO: "SEXO",
  EDAT: "EDAT",
  PES: "PES",
  Talla: "Talla",
  IMC: "IMC",
  ASA: "ASA",
  DATAIQCOLON: "DATAIQCOLON",
  EPPO: "EPPO",
  DATAHEP: "DATAHEP",
  ESTADA: "ESTADA",
  RESMAY_MEN_ampli: "RESMAY_MEN_ampli",
  TecnicaQuir_descripció: "TecnicaQuir_descripció",
  VIAACCES: "VIA ACCES",
  RF: "RF",
  mw: "mw",
  ValRcir: "Val R cir",
  NMETIMAGpre: "NMETIMAGpre",
  MIDAMHIMATGE: "MIDA MH  IMATGE",
  BILOBUL: "BILOBUL",
  RES2: "RES2",
  RES3: "RES3",
  CIRSIMCOLON: "CIRSIMCOLON",
  TIPUSCIRSIMCOL: "TIPUSCIRSIMCOL",
  TIPUSCIRCOLONSIM: "TIPUS CIRCOLONSIM",
  MORBIDITAT: "MORBIDITAT",
  GRAUCLAVIEN: "GRAU CLAVIEN",
  CCIndex: "CCIndex",
  NMETAP: "NMETAP",
  MIDAAP: "MIDA AP",
  MARGEN: "MARGEN",
  INVMARG: "INVMARG",
  TRATMARGE: "TRATMARGE",
  DATAULTCONT: "DATA ULT CONT",
  ALPSS: "ALPSS",
  INSUFHEPisgls: "INSUFHEP isgls",
  ESTAT: "ESTAT",
  FISTBILI: "FISTBILI",
  GrauIH: "Grau IH",
  INFESPAI: "INF ESPAI",
  HEMOPER: "HEMOPER",
  ASCITIS: "ASCITIS",
  REIQ: "REIQ",
  GRAUFB: "GRAU FB",
  MORTALITAT: "MORTALITAT",
  CausaREIQ: "Causa REIQ",
  RECIDIVA: "RECIDIVA",
  RECHEP: "RECHEP",
  RECPUL: "RECHEP",
  DataEXITUS: "Data EXITUS",
};
