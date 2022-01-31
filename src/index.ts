import puppeteer from "puppeteer";
import xlsx, { WorkSheet } from "node-xlsx";
import fs, { unwatchFile } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { HEADERS_LIVER_DDBB, TransformXlsxToJSDateFormat } from "./crossExcels";

import { GENERAL_CONSTS } from "./consts/general";
import { HTML_IDS_LIVER, NOSINOC, NOSINOCType } from "./consts/fetge";
import { parseXlsx } from "./excel-functions";

const __filename = fileURLToPath(import.meta.url);

const getHeadersObj = (headers) => {
  const returnObj = {};

  headers.forEach((header) => {
    // Object.assign(returnObj, )
  });
  return;
};

type SubmitStates = "LOADED" | "FAILED" | "DISCONNECTED";

const {
  TEXT_INPUT_FROM_DATE,
  TEXT_INPUT_TO_DATE,
  TEXT_INPUT_NHC,
  BUTTON_EXECUTE_FILTER,
  TEXT_INPUT_FILTER_BY_LIVER,
} = GENERAL_CONSTS.INTERFACE_IDS.FILTER_PAGE;
const { BUTTON_BACK_LIST, LINK_LIST_ITEM } =
  GENERAL_CONSTS.INTERFACE_IDS.LIST_PAGE;
const { BUTTON_BACK_FORM } = GENERAL_CONSTS.INTERFACE_IDS.FORM_PAGE;

type InterfacePuppeteerSetupRes = {
  browser: puppeteer.Browser;
  pages: puppeteer.Page[];
  frame: puppeteer.Frame;
};

const getInterfacePuppeteerSetup = (
  wsChromeEndpointurl = "ws://127.0.0.1:9222/devtools/browser/69f0a4d2-9bb1-4bd1-84da-57601ecd67e6",
  reload = false
): Promise<InterfacePuppeteerSetupRes> =>
  new Promise(async (res, rej) => {
    const browser = await puppeteer.connect({
      browserWSEndpoint: wsChromeEndpointurl,
    });

    // 2nd puppeteer method
    // const browser = await puppeteer.launch({ headless: false }); // new browser instance
    // const page = await browser.newPage(); // new page
    // await page.goto(
    //   "https://salut.gencat.cat/pls/gsa/gsapkmen.inici?p_aplicacio=RTO&p_usuari=47654431h",
    //   { waitUntil: "networkidle2" }
    // );

    const pages = await browser.pages();
    if (reload)
      await pages[0].reload({
        waitUntil: ["networkidle0", "domcontentloaded"],
      });
    const currentPage = pages[0];

    await currentPage.bringToFront();

    const frame = await currentPage
      .frames()
      .find((f) => f.name() === "aplicacio");

    const puppeteerInstances = {
      browser,
      pages,
      frame,
    };
    res(puppeteerInstances);
  });

const ExecutePuppeteerSearch = (
  frame: puppeteer.Frame,
  NHC: string
): Promise<SubmitStates> =>
  new Promise(async (res, rej) => {
    // change to LIVER first

    const DATES = {
      FROM: "2019",
      TO: "2020",
    };

    await Promise.all([
      frame.$eval(
        TEXT_INPUT_FROM_DATE,
        (el: any, FROM) => (el.value = FROM),
        DATES.FROM
      ),
      frame.$eval(
        TEXT_INPUT_TO_DATE,
        (el: any, TO) => (el.value = TO),
        DATES.TO
      ),
      frame.$eval(TEXT_INPUT_NHC, (el: any, nhc) => (el.value = nhc), NHC),
    ]);

    // variables must be passed as node env varibles, see:
    // https://stackoverflow.com/questions/55524329/puppeteer-access-to-outer-scope-variable-fails

    // // SEARCH
    await Promise.all([
      frame.$eval(BUTTON_EXECUTE_FILTER, (el: any) => el.click()),
      frame.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);

    res("LOADED");

    // await page.waitForSelector("input[name=search]");

    // await page.type('input[name=search]', 'Adenosine triphosphate');
    // await page.$eval(
    //   "input[name=search]",
    //   (el:any) => (el.value = "Adenosine triphosphate")
    // );

    // await page.type("input[name=search]", "Adenosine triphosphate", {
    //   delay: 200,
    // });

    // await page.click('input[type="submit"]');
    // await page.waitForSelector("#mw-content-text");
    // const text = await page.evaluate(() => {
    //   const anchor = document.querySelector("#mw-content-text");
    //   return anchor.textContent;
    // });
    // await page.screenshot("png", "test1.png");
    //   await page.pdf({ path: "hn.pdf", format: "a4" });

    // console.log(text);
    //   await browser.close();
  });

// // GOBACK FROM LIST
const goBackFromList = async (frame: puppeteer.Frame) => {
  await Promise.all([
    frame.waitForSelector(BUTTON_BACK_LIST),
    frame.$eval(BUTTON_BACK_LIST, (el: any) => el.click()),
    frame.waitForNavigation({ waitUntil: "networkidle2" }),
  ]);
};

const goBackFromForm = async (frame: puppeteer.Frame) => {
  await Promise.all([
    frame.waitForSelector(BUTTON_BACK_FORM),
    frame.$eval(BUTTON_BACK_FORM, (el: any) => el.click()),
    frame.waitForNavigation({ waitUntil: "networkidle2" }),
  ]);
};

const getScrappingData = async () => {
  const ddbbData = await parseXlsx("output/crossedData");
  const HEADERS = ddbbData.shift();

  // - check if name and lastnames are equal to ddbb
  // - check if Register is closed
  // - in case it's closed uncheck it

  const { browser, pages, frame } = await getInterfacePuppeteerSetup();

  for (let i = 0; i < 1; i++) {
    const currentObservation = ddbbData[i];
    const currentNHC = currentObservation[HEADERS_LIVER_DDBB.SAP];

    const ValueDataIngres = currentObservation[HEADERS_LIVER_DDBB.DATAHEP];
    const ValueDataDiagnostic = (
      parseInt(ValueDataIngres) -
      (Math.random() * (10 - 5) + 5)
    ).toString(); // !!
    const ValueDataAlta = (
      parseInt(ValueDataIngres) +
      parseInt(currentObservation[HEADERS_LIVER_DDBB.ESTADA] || "0")
    ) // !! estada not always defined
      .toString();

    console.log("valueDataIngres: ", ValueDataIngres);
    console.log(
      "currentObservation[HEADERS_LIVER_DDBB.ESTADA]: ",
      currentObservation[HEADERS_LIVER_DDBB.ESTADA]
    );

    const ValueDataIQ = currentObservation[HEADERS_LIVER_DDBB.DATAHEP];
    const ValueEdatIQ = currentObservation[HEADERS_LIVER_DDBB.EDAT];
    const ValuePes = currentObservation[HEADERS_LIVER_DDBB.PES]; //??
    const ValueTalla = currentObservation[HEADERS_LIVER_DDBB.Talla]; //??
    const ValueASA = currentObservation[HEADERS_LIVER_DDBB.ASA];
    const ValueEcog = "NO-CONSTA"; //??
    const ValueEras = "NO"; //??
    const ValueCMDAbans = currentObservation[HEADERS_LIVER_DDBB.COMITE];
    const ValueCMDInforme = ValueCMDAbans;
    const ValueCMDAbansData = (
      parseInt(ValueDataIngres) -
      (Math.random() * (40 - 30) + 30)
    ).toString(); // !!  2 months before aprox
    const ValueCMDAfter = "NO-CONSTA"; // !!

    const ValueTipusCirugHepatica = "MTHs";

    // Tractament hepatic (técnica)
    const ValueTecnica = currentObservation[HEADERS_LIVER_DDBB.TECNICA];
    const ValueRadio = currentObservation[HEADERS_LIVER_DDBB.RF];
    const ValueMW = currentObservation[HEADERS_LIVER_DDBB.mw];

    const wasIQ = ValueTecnica && ValueTecnica !== ""; // sometimes fail: check inference from other variables

    // const ValueTractamentHepatic = wasIQ ?

    console.log(ValueDataIngres);
    console.log(ValueDataAlta);
    console.log(ValueDataDiagnostic);

    // continue;

    if ((await ExecutePuppeteerSearch(frame, currentNHC)) !== "LOADED") {
      console.error("somet hing went wrong");
    }

    // GO to list item form
    const currentItemId = LINK_LIST_ITEM(i);
    await Promise.all([
      frame.$eval(currentItemId, (el: any) => el.click()),
      frame.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);

    // specific code for LIVER

    /* TODOS: 
    // 1. GET ALL VARIABLES FROM EXCEL FIRST AND IF ANY IS MISSING:
        1.A. ADD TO ARRAY WITH THIS ROW
        1.B. OMIT CURRENT PUPPETEER REGISTER AND GO BACK TO FILTER SCREEN
        1.C. ADD ALL THOSE OBSERVATIONS TO A EXCEL
        *** WHILE DOING ALGORITHM TEST IT WITHOUT PUPPETEER


     */

    // const IsFormClosed_ID = HTML_IDS_LIVER.TANCAMENT_REGISTRE_DADES;
    // await Promise.all([
    //   frame.$eval(IsFormClosed_ID, async (el: any) => {
    //     if (el.value === "true") {
    //       el.click();
    //     }
    //   }),
    //   frame.waitForNavigation({ waitUntil: "networkidle2" }),
    // ]);

    // START INPUTING DATA
    const { DATA_INGRES, DATA_ALTA, DATA_DIAGNOSTIC } = HTML_IDS_LIVER;

    const DataIngresInOddFormat = TransformXlsxToJSDateFormat(ValueDataIngres);
    console.log("DataIngresInOddFormat: ", DataIngresInOddFormat);

    const DataAltaInOddFormat = TransformXlsxToJSDateFormat(ValueDataAlta);
    console.log("DataAltaInOddFormat: ", DataAltaInOddFormat);
    const DataDiagnosticInOddFormat =
      TransformXlsxToJSDateFormat(ValueDataDiagnostic);
    console.log("DataDiagnosticInOddFormat: ", DataDiagnosticInOddFormat);
    const DataIQInOddFormat = TransformXlsxToJSDateFormat(ValueDataIQ);
    console.log("DataIQInOddFormat: ", DataIQInOddFormat);

    await Promise.all([
      // CHECK VALUES OF ASA WITH EXISTING FORM
      frame.$eval(
        DATA_INGRES,
        (el: any, value) => (el.value = value),
        DataIngresInOddFormat
      ),
      frame.$eval(
        DATA_ALTA,
        (el: any, value) => (el.value = value),
        DataAltaInOddFormat
      ),
      frame.$eval(
        DATA_DIAGNOSTIC,
        (el: any, value) => (el.value = value),
        DataDiagnosticInOddFormat
      ),
      frame.$eval(
        DATA_DIAGNOSTIC,
        (el: any, value) => (el.value = value),
        DataIQInOddFormat
      ),

      frame.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);

    const { ASA } = HTML_IDS_LIVER;

    // await Promise.all([
    //   // CHECK VALUES OF ASA WITH EXISTING FORM
    //   frame.select(ASA.ID, ASA.VALUES[ValueASA]),
    //   // frame.waitForNavigation({ waitUntil: "networkidle2" }),
    // ]);

    console.log(`patient nº ${i} searched`);

    // await pages[0].reload({ waitUntil: ["networkidle0", "domcontentloaded"] });

    // await goBackFromForm(frame);
    // await goBackFromList(frame);
  }
};

getScrappingData();
