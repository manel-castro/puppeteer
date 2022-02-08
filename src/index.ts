import puppeteer from "puppeteer";
import xlsx, { WorkSheet } from "node-xlsx";
import fs, { unwatchFile } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  buildXlsxFile2,
  HEADERS_LIVER_DDBB,
  TransformXlsxToJSDateFormat,
} from "./crossDataGood";
import moment from "moment";

import { GENERAL_CONSTS, INTERFACE_IDS } from "./consts/general";
import { HTML_IDS_LIVER, NOSINOC, NOSINOCType } from "./consts/fetge";
import { parseXlsx } from "./excel-functions";
import { parseXlsx2 } from "./crossDataGood";

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
} = INTERFACE_IDS.FILTER_PAGE;
const { BUTTON_BACK_LIST, LINK_LIST_ITEM } = INTERFACE_IDS.LIST_PAGE;
const { BUTTON_BACK_FORM } = INTERFACE_IDS.FORM_PAGE;

type InterfacePuppeteerSetupRes = {
  browser: puppeteer.Browser;
  pages: puppeteer.Page[];
  frame: puppeteer.Frame;
};

const getInterfacePuppeteerSetup = (
  wsChromeEndpointurl = "ws://127.0.0.1:9222/devtools/browser/d79cba18-3b57-4d62-9d74-e0074019616f",
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

    try {
      await frame.$eval(
        TEXT_INPUT_FROM_DATE,
        (el: any, FROM) => (el.value = FROM),
        DATES.FROM
      );
      await frame.$eval(
        TEXT_INPUT_TO_DATE,
        (el: any, TO) => (el.value = TO),
        DATES.TO
      );
    } catch (e) {
      console.error("Unable to complete date form search input data ");
      console.error(e);
    }

    try {
      await frame.$eval(
        TEXT_INPUT_NHC,
        (el: any, nhc) => (el.value = nhc),
        NHC
      );
    } catch (e) {
      console.error("Unable to complete NHC form search input data ");
      console.error(e);
    }
    // variables must be passed as node env varibles, see:
    // https://stackoverflow.com/questions/55524329/puppeteer-access-to-outer-scope-variable-fails

    // // SEARCH

    try {
      await Promise.all([
        frame.$eval(BUTTON_EXECUTE_FILTER, (el: any) => el.click()),
        frame.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);
    } catch (e) {
      console.error("Unable to complete form search click search");
      console.error(e);
    }

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
const saveForm = async (frame: puppeteer.Frame) => {
  const saveButtID = INTERFACE_IDS.FORM_PAGE.BUTTON_SAVE_FORM;
  await Promise.all([
    frame.waitForSelector(saveButtID),
    frame.$eval(saveButtID, (el: any) => el.click()),
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
  const ddbbData = await parseXlsx2("output/crossedData2", "crossedData2");

  // - check if name and lastnames are equal to ddbb
  // - check if Register is closed
  // - in case it's closed uncheck it

  const { browser, pages, frame } = await getInterfacePuppeteerSetup();

  const { TEXT_CURRENT_FILTER_PAGE_TYPE, LINK_FILTER_BY_LIVER } =
    INTERFACE_IDS.FILTER_PAGE;

  try {
    const headerText = (await frame.$eval(
      TEXT_CURRENT_FILTER_PAGE_TYPE,
      (el: any, frame) => {
        return el.textContent;
      }
    )) as string;
    if (!headerText.includes("hepàtica")) {
      console.log("Redirecting to liver page");

      await frame.$eval(LINK_FILTER_BY_LIVER, (ele: any) => ele.click());
      await frame.waitForNavigation({ waitUntil: "networkidle2" });
    }
  } catch (e) {
    console.error("Not in form search page");
  }

  // await ShowEditFunctionalities(frame);

  console.log("first");

  const whereWeLeftIt = readLastObservationNumber();
  console.log("next, num is ", whereWeLeftIt);

  const initialCount = whereWeLeftIt + 1 || 0;

  for (let i = initialCount; i < 8; i++) {
    const errors = [];

    const currentObservation = ddbbData[i];

    const currentNHC = currentObservation[HEADERS_LIVER_DDBB.SAP];

    // const _formNHC = (await (
    //   await (
    //     await frame.$(basicParseID(HTML_IDS_LIVER.TEXT_FORM_NHC))
    //   ).getProperty("value")
    // ).jsonValue()) as string;

    console.log("Starting with obs nº: ", i);
    console.log("NHC: ", currentNHC);

    let ValueDataIngres = parseDateToMiliseconds(
      new Date(currentObservation[HEADERS_LIVER_DDBB.DATAHEP])
    );

    const ValueDataIQ = ValueDataIngres;

    const ValueDataDiagnostic = addDaysToMilisecondsAndGetDate(
      ValueDataIngres,
      -50
    ); // !!

    const Estada = currentObservation[HEADERS_LIVER_DDBB.ESTADA];

    const ValueDataAlta = addDaysToMilisecondsAndGetDate(
      ValueDataIngres,
      parseInt(Estada)
    );

    // !! estada not always defined

    const ValueEdatIQ = currentObservation[HEADERS_LIVER_DDBB.EDAT];
    const ValuePes = currentObservation[HEADERS_LIVER_DDBB.PES]; //??
    const ValueTalla = currentObservation[HEADERS_LIVER_DDBB.Talla]; //??
    const ValueASA = currentObservation[HEADERS_LIVER_DDBB.ASA];
    const ValueEcog = "NO-VALORAT"; //??
    const ValueEras = "NO"; //??

    if (
      !ValueEdatIQ ||
      !ValuePes ||
      !ValueTalla ||
      !ValueASA ||
      !ValueEcog ||
      !ValueEras
    ) {
      const errorMessage = "Falta alguna variable, revisar";
      console.error("errorMessage: ", errorMessage);

      errors.push(errorMessage);
      addToUncompletedList(currentObservation, errorMessage);
      continue;
    }

    // const ValueTractamentHepatic = wasIQ ?

    // continue;
    // if (false)
    const puppeterSearchResult = await ExecutePuppeteerSearch(
      frame,
      currentNHC
    );

    if (puppeterSearchResult !== "LOADED") {
      console.error("something went wrong");
    }

    // GO to list item form
    const currentItemId = LINK_LIST_ITEM(i);
    // if (false)
    try {
      await Promise.all([
        frame.$eval(currentItemId, (el: any) => el.click()),
        frame.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);
    } catch (e) {
      console.error("Unable to complete click list link");
      console.error(e);
    }

    // specific code for LIVER

    /* TODOS: 
    // 1. GET ALL VARIABLES FROM EXCEL FIRST AND IF ANY IS MISSING:
        1.A. ADD TO ARRAY WITH THIS ROW
        1.B. OMIT CURRENT PUPPETEER REGISTER AND GO BACK TO FILTER SCREEN
        1.C. ADD ALL THOSE OBSERVATIONS TO A EXCEL
        *** WHILE DOING ALGORITHM TEST IT WITHOUT PUPPETEER


     */

    try {
      const _formNHC = (await (
        await (
          await frame.$(basicParseID(HTML_IDS_LIVER.TEXT_FORM_NHC))
        ).getProperty("value")
      ).jsonValue()) as string;

      if (_formNHC != currentNHC) {
        console.error(
          "NHC NOT MATCHING. Revise registers. Going back, try again..."
        );
        // TODO: https://stackoverflow.com/questions/3072718/restart-function-that-is-running
        // Also might reload to go to Search and abstract search function to reuse here
        await goBackFromForm(frame);
        await goBackFromList(frame);

        break;
      }
    } catch (e) {
      console.error("UNABLE TO EXECUTE NHC COMPARISON");
      console.error("ERROR IS: ", e);
    }

    // if (false) {
    try {
      const _isTancat = (await (
        await (await frame.$(HTML_IDS_LIVER.DATA_IQ)).getProperty("className")
      ).jsonValue()) as string;

      const isTancat = _isTancat !== "EDITModificableNoObligatori";

      const IsFormClosed_ID = HTML_IDS_LIVER.TANCAMENT_REGISTRE_DADES;
      await frame.$eval(
        IsFormClosed_ID,
        (el: any, value) => {
          if (!value) {
            el.click();
          }
        },
        isTancat
      );

      // await frame.waitForNavigation({ waitUntil: "networkidle2" });
    } catch (e) {
      console.error("Tancament registre func error");
      console.error(e);
    }
    // }

    // START INPUTING DATA
    console.log("********************");
    console.log("START INPUTING DATA");
    console.log("********************");

    const {
      DATA_INGRES,
      DATA_ALTA,
      DATA_DIAGNOSTIC,
      DATA_IQ,
      EDAT_IQ,
      PES_KG,
      TALLA_CM,
    } = HTML_IDS_LIVER;

    const DataIngresInOddFormat = formatDate(
      addDaysToMilisecondsAndGetDate(ValueDataIngres, 0)
    );

    const DataAltaInOddFormat = formatDate(ValueDataAlta);

    const DataDiagnosticInOddFormat = formatDate(ValueDataDiagnostic);

    const DataIQInOddFormat = formatDate(ValueDataIQ);

    if (
      !DataAltaInOddFormat ||
      !DataDiagnosticInOddFormat ||
      !DataIQInOddFormat ||
      !DataIngresInOddFormat
    ) {
      const errorMessage = "Error en alguna fechas formateadas, revisar";
      errors.push(errorMessage);
      addToUncompletedList(currentObservation, errorMessage);
      continue;
    }
    // if (false)

    try {
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
          DATA_IQ,
          (el: any, value) => (el.value = value),
          DataIQInOddFormat
        ),
        frame.$eval(
          EDAT_IQ,
          (el: any, value) => (el.value = value),
          ValueEdatIQ
        ),
        frame.$eval(PES_KG, (el: any, value) => (el.value = value), ValuePes),
        frame.$eval(
          TALLA_CM,
          (el: any, value) => (el.value = value),
          ValueTalla
        ),

        // frame.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);
    } catch (e) {
      console.error(
        "unable to complete promise all for general input data, error message: "
      );
      console.error(e);
    }

    const { ASA, ECOG, ERAS } = HTML_IDS_LIVER;

    // if (false)
    try {
      await Promise.all([
        // CHECK VALUES OF ASA WITH EXISTING FORM
        frame.select(ASA.ID, ASA.VALUES[ValueASA]),
        frame.select(ECOG.ID, ECOG.VALUES[ValueEcog]),
        frame.select(ERAS.ID, ERAS.VALUES[ValueEras]),
        // frame.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);
    } catch (e) {
      console.error(
        "unable to complete promise all for general ASA/ECOG/ERAS data, error message: "
      );
      console.error(e);
    }
    const ValueCMDAbans =
      currentObservation[HEADERS_LIVER_DDBB.COMITE]?.toUpperCase() ||
      "NOCONSTA";

    const ValueCMDInforme = ValueCMDAbans;
    const ValueCMDAbansData = ValueCMDAbans
      ? formatDate(
          addDaysToMilisecondsAndGetDate(
            ValueDataIngres,
            -(Math.random() * (60 - 50) + 50)
          )
        )
      : ""; // !!  2 months before aprox
    const ValueCMDAfter = "NOCONSTA"; // !!

    const ValueTipusCirugHepatica = "MTHs";

    if (!ValueCMDAbans || !ValueCMDAbansData) {
      const errorMessage = "Error en alguna variable de CMD, revisar";
      errors.push(errorMessage);
      addToUncompletedList(currentObservation, errorMessage);
      continue;
    }

    try {
      await Promise.all([
        // CHECK VALUES OF ASA WITH EXISTING FORM
        frame.select(
          HTML_IDS_LIVER.CMD_ABANS.ID,
          HTML_IDS_LIVER.CMD_ABANS.VALUES[ValueCMDAbans]
        ),

        frame.select(
          HTML_IDS_LIVER.CMD_DESPRES.ID,
          HTML_IDS_LIVER.CMD_DESPRES.VALUES[ValueCMDAfter]
        ),
      ]);

      // await frame.waitForNavigation({ waitUntil: "networkidle2" });
    } catch (e) {
      console.error(
        "unable to complete promise all for CMD data before condition, error message: "
      );
      console.error(e);
    }

    //____TODO: TEST THIS CONDITION____

    if (ValueCMDAbans === "SI" && ValueCMDAbansData) {
      try {
        console.log("ValueCMDAbansData", ValueCMDAbansData);

        // await Promise.all([
        //   frame.waitForSelector(HTML_IDS_LIVER.TEXT_DATA_CMD_ABANS),
        //   frame.waitForSelector(HTML_IDS_LIVER.INFORME_CMD_ABANS.ID),
        // ]);

        /*
         HTML_IDS_LIVER.NUM_MH_DIAG,
          (el: any, value) => (el.value = value),
          numMH
        */
        await Promise.all([
          frame.$eval(
            HTML_IDS_LIVER.TEXT_DATA_CMD_ABANS,
            (el: any, value) => (el.value = value),
            ValueCMDAbansData
          ),
          frame.select(
            HTML_IDS_LIVER.INFORME_CMD_ABANS.ID,
            HTML_IDS_LIVER.INFORME_CMD_ABANS.VALUES[ValueCMDInforme]
          ),
        ]);
      } catch (e) {
        const errorMessage =
          "unable to complete promise all for CMD data after condition CMD = true, error message: ";
        console.error(errorMessage);
        console.error(e);
        errors.push(errorMessage);
        addToUncompletedList(currentObservation, errorMessage);
        continue;
      }
    }

    const ValueIndicacioCirugiaHep = "MH";

    // await frame.waitForNavigation({ waitUntil: "networkidle2" });

    // Tractament hepatic (técnica)
    const ValueTecnica = (
      currentObservation[HEADERS_LIVER_DDBB.TECNICA] as string
    ).toLowerCase();
    const strValueRadio = currentObservation[HEADERS_LIVER_DDBB.RF];
    const strValueMW = currentObservation[HEADERS_LIVER_DDBB.mw];

    const wasIQ = ValueTecnica && ValueTecnica !== ""; // sometimes fail: check inference from other variables

    //   VALUES: {
    //     QUIRURGIC_ONLY: string;
    //     LOCOREGIONAL_ONLY: string;
    //     LOCOREGIONAL_AND_QUIRURGIC: string;
    // }

    if (!ValueTecnica || !strValueRadio || !strValueMW) {
      const errorMessage = "Faltan varaibles de Tecnica IQ";
      errors.push(errorMessage);
      addToUncompletedList(currentObservation, errorMessage);
      continue;
    }

    const ValueRadio = strValueRadio === "Si" ? true : false;
    const ValueMW = strValueMW === "Si" ? true : false;

    const tecnicaIsQuirurgicUnicament =
      wasIQ &&
      ValueTecnica.includes("hepatectomia major") &&
      ValueTecnica.includes("resecció");

    const ValueTractamentHepátic =
      tecnicaIsQuirurgicUnicament && (ValueRadio || ValueMW)
        ? "LOCOREGIONAL_AND_QUIRURGIC"
        : "QUIRURGIC_ONLY"; // no data for Locoregional Only, done by Hospitals without resources

    try {
      await Promise.all([
        frame.select(
          HTML_IDS_LIVER.IND_CIRU_HEP.ID,
          HTML_IDS_LIVER.IND_CIRU_HEP.VALUES[ValueIndicacioCirugiaHep]
        ),

        frame.select(
          HTML_IDS_LIVER.TRACTAMENT_H.ID,
          HTML_IDS_LIVER.TRACTAMENT_H.VALUES[ValueTractamentHepátic]
        ),
      ]);

      frame.waitForNavigation();

      // await frame.waitForNavigation(); // formulary might change
    } catch (e) {
      console.error("____ UNABLE TO SOLVE IND_CIRU_HEP && TRACTAMENT_H ");
    }

    // Via access

    const ValueAccessIq = currentObservation[HEADERS_LIVER_DDBB.VIAACCES];

    const Conversio =
      ValueAccessIq === "Convertida" ||
      ValueAccessIq === "1er temps (mobilització)"
        ? true
        : false;
    const LapConversioPlanejada =
      Conversio && ValueAccessIq === "1er temps (mobilització)";

    const ValueViaAccess =
      !ValueAccessIq || ValueAccessIq === ""
        ? "NOCONSTA"
        : LapConversioPlanejada
        ? "LAPAROSCOPICA_CONV"
        : Conversio
        ? "LAPAROSCOPICA"
        : "OBERTA";

    const _valRCir = currentObservation[HEADERS_LIVER_DDBB.ValRcir] as string;
    const ValueRadicalitatIQCirugia = _valRCir.includes("R0")
      ? "R0"
      : _valRCir.includes("R1")
      ? "R1"
      : _valRCir.includes("R2")
      ? "R2"
      : "NOCONSTA";
    const { ACCESS_IQ, CONVERSIO, CONVERSIO_PLANEJADA, RADICALITAT_IQ } =
      HTML_IDS_LIVER;

    console.log("start inputing IQ data");

    try {
      // await Promise.all([
      //   await frame.waitForSelector(CONVERSIO.ID),
      //   await frame.waitForSelector(ACCESS_IQ.ID),
      //   await frame.waitForSelector(RADICALITAT_IQ.ID),
      // ]);

      await Promise.all([
        // CHECK VALUES OF ASA WITH EXISTING FORM
        frame.select(
          ACCESS_IQ.ID,
          HTML_IDS_LIVER.ACCESS_IQ.VALUES[ValueViaAccess]
        ),

        frame.select(
          RADICALITAT_IQ.ID,
          HTML_IDS_LIVER.RADICALITAT_IQ.VALUES[ValueRadicalitatIQCirugia]
        ),
      ]);
    } catch (e) {
      console.error(
        "unable to complete promise all for VIA D'ACCES before condition, error message: "
      );
      console.error(e);
    }

    try {
      await frame.select(
        CONVERSIO.ID,
        HTML_IDS_LIVER.CONVERSIO.VALUES[Conversio ? "SI" : "NO"]
      );
    } catch (e) {
      console.error("!!!!!!", e);
    }

    console.log("end inputing IQ data");
    try {
      if (Conversio) {
        // await frame.waitForSelector(CONVERSIO_PLANEJADA.ID);

        await frame.select(
          CONVERSIO_PLANEJADA.ID,
          HTML_IDS_LIVER.CONVERSIO.VALUES[LapConversioPlanejada ? "SI" : "NO"]
        );
      }
    } catch (e) {
      console.error(
        "unable to complete promise all for VIA D'ACCES after condition, error message: "
      );
      console.error(e);
    }

    const numMH = currentObservation[HEADERS_LIVER_DDBB.NMETIMAGpre];
    const MHMajorDiam = Math.round(
      parseInt(currentObservation[HEADERS_LIVER_DDBB.MIDAMHIMATGE]) * 10
    ).toString();

    try {
      await Promise.all([
        frame.select(
          HTML_IDS_LIVER.TUMOR_ORIGEN_MH.ID,
          HTML_IDS_LIVER.TUMOR_ORIGEN_MH.VALUES["CCR"]
        ),
        frame.$eval(
          HTML_IDS_LIVER.NUM_MH_DIAG,
          (el: any, value) => (el.value = value),
          numMH
        ),
        frame.$eval(
          HTML_IDS_LIVER.DIAMETRE_MAJOR_MH,
          (el: any, value) => (el.value = value),
          MHMajorDiam
        ),
      ]);
    } catch (e) {
      console.error("!!!!!!", e);
    }

    const numReseccPrev = currentObservation[HEADERS_LIVER_DDBB.RES3]
      ? "2"
      : currentObservation[HEADERS_LIVER_DDBB.RES2]
      ? "1"
      : "0";
    const affBilob = currentObservation[HEADERS_LIVER_DDBB.BILOBUL];

    try {
      await Promise.all([
        frame.$eval(
          HTML_IDS_LIVER.NUM_RESECCIONS_H_PREV,
          (el: any, value) => (el.value = value),
          numReseccPrev
        ),
        frame.select(
          HTML_IDS_LIVER.AFECTACIO_BILOBULAR_MH.ID,
          HTML_IDS_LIVER.AFECTACIO_BILOBULAR_MH.VALUES[
            affBilob === "Si" ? "SI" : affBilob === "No" ? "NO" : "NOCONSTA"
          ]
        ),
      ]);
    } catch (e) {
      console.error("!!!!!!", e);
    }

    const iQSimuTumorPrimary =
      currentObservation[HEADERS_LIVER_DDBB.CIRSIMCOLON];

    const _tipusReseccioMH = currentObservation[
      HEADERS_LIVER_DDBB.RESMAY_MEN_ampli
    ] as string;
    const tipusReseccioMH: keyof typeof HTML_IDS_LIVER.TIPUS_RESECCIO_MH.VALUES =
      _tipusReseccioMH.includes("ampliada")
        ? "MAJOR_EXTESA"
        : _tipusReseccioMH.includes("Major")
        ? "MAJOR"
        : _tipusReseccioMH.includes("Menor")
        ? "MENOR"
        : "NO_CONSTA";

    const tipusBrisbane = "LLEGIR CASOS DEL TecnicaQuir_descripció";

    try {
      await Promise.all([
        frame.select(
          basicParseID(HTML_IDS_LIVER.IQ_SIMULT_TUMOR_PRIMARI.ID),
          HTML_IDS_LIVER.IQ_SIMULT_TUMOR_PRIMARI.VALUES[
            NoSiParse(iQSimuTumorPrimary)
          ]
        ),
        frame.select(
          basicParseID(HTML_IDS_LIVER.TIPUS_RESECCIO_MH.ID),
          HTML_IDS_LIVER.TIPUS_RESECCIO_MH.VALUES[tipusReseccioMH]
        ),
        // frame.select( MODIFICAR PER BRISBANE, s'haurà d'afegir loc.
        //   HTML_IDS_LIVER.AFECTACIO_BILOBULAR_MH.ID,
        //   HTML_IDS_LIVER.AFECTACIO_BILOBULAR_MH.VALUES[
        //     affBilob === "Si" ? "SI" : affBilob === "No" ? "NO" : "NOCONSTA"
        //   ]
        // ),
      ]);
      frame.waitForNavigation();
    } catch (e) {
      console.error("!!!!!!", e);
    }

    try {
      if (tipusReseccioMH === "MAJOR_EXTESA") {
        const valueALPSS = currentObservation[HEADERS_LIVER_DDBB.ALPSS];
        const valueEmbPortal = currentObservation[HEADERS_LIVER_DDBB.EPPO];
        const valueRadioEmb = "NO";
        await Promise.all([
          frame.select(
            basicParseID(HTML_IDS_LIVER.ALPSS.ID),
            HTML_IDS_LIVER.ALPSS.VALUES[
              valueALPSS === "Si"
                ? "SI"
                : valueALPSS === "No"
                ? "NO"
                : "NOCONSTA"
            ]
          ),
          frame.select(
            basicParseID(HTML_IDS_LIVER.EMBOLITZACIO_PORTAL_PREOP_MH.ID),
            HTML_IDS_LIVER.EMBOLITZACIO_PORTAL_PREOP_MH.VALUES[
              valueEmbPortal === "Si"
                ? "SI"
                : valueEmbPortal === "No"
                ? "NO"
                : "NOCONSTA"
            ]
          ),
          frame.select(
            basicParseID(HTML_IDS_LIVER.RADIOEMBOLITZACIO_MH.ID),
            HTML_IDS_LIVER.RADIOEMBOLITZACIO_MH.VALUES[valueRadioEmb]
          ),

          // frame.select( MODIFICAR PER BRISBANE, s'haurà d'afegir loc.
          //   HTML_IDS_LIVER.AFECTACIO_BILOBULAR_MH.ID,
          //   HTML_IDS_LIVER.AFECTACIO_BILOBULAR_MH.VALUES[
          //     affBilob === "Si" ? "SI" : affBilob === "No" ? "NO" : "NOCONSTA"
          //   ]
          // ),
        ]);
        frame.waitForNavigation();
      }
    } catch (e) {
      console.error("!!!!!!", e);
    }

    // ************
    // Compl PostIQ
    // ************

    const valueComplPostIQ =
      parseInt(currentObservation[HEADERS_LIVER_DDBB.GRAUCLAVIEN]) !== 0;

    try {
      await Promise.all([
        frame.select(
          basicParseID(HTML_IDS_LIVER.COMPL_POST_IQ_90_DIES.ID),
          HTML_IDS_LIVER.COMPL_POST_IQ_90_DIES.VALUES[
            valueComplPostIQ ? "SI" : "NO"
          ]
        ),
      ]);
      // frame.waitForNavigation();
    } catch (e) {
      console.error("!!!!!!", e);
    }

    try {
      if (valueComplPostIQ) {
        // *****************
        // Compl PostIQ
        // ---- Especifiques
        // *****************
        const valueInsufHepatica =
          currentObservation[HEADERS_LIVER_DDBB.INSUFHEPisgls];
        const valueInsufHepaticaGrau =
          currentObservation[HEADERS_LIVER_DDBB.GrauIH];
        const valueFistulaBil = currentObservation[HEADERS_LIVER_DDBB.FISTBILI];
        const valueFistulaBilGrau =
          currentObservation[HEADERS_LIVER_DDBB.GRAUFB];
        const valueFistulaBilDebitDiari = "0";
        const valueCalDrenatge =
          currentObservation[HEADERS_LIVER_DDBB.INFESPAI];
        const valueHemoper = currentObservation[HEADERS_LIVER_DDBB.HEMOPER];
        const valueAscitis = currentObservation[HEADERS_LIVER_DDBB.ASCITIS];

        await frame.select(
          basicParseID(HTML_IDS_LIVER.COMPL_ESPECIFIQUES.INSF_HEPATICA.ID),
          HTML_IDS_LIVER.COMPL_ESPECIFIQUES.INSF_HEPATICA.VALUES[
            NoSiParse(valueInsufHepatica)
          ]
        );

        if (valueInsufHepatica === "Si" && valueInsufHepatica)
          await frame.select(
            basicParseID(HTML_IDS_LIVER.COMPL_ESPECIFIQUES.GRAU_INSF_HEP.ID),
            HTML_IDS_LIVER.COMPL_ESPECIFIQUES.GRAU_INSF_HEP.VALUES[
              valueInsufHepaticaGrau
            ]
          );
        await frame.select(
          basicParseID(HTML_IDS_LIVER.COMPL_ESPECIFIQUES.FISTULA_BILIAR.ID),
          HTML_IDS_LIVER.COMPL_ESPECIFIQUES.FISTULA_BILIAR.VALUES[
            NoSiParse(valueFistulaBil)
          ]
        );
        if (valueFistulaBilGrau === "Si" && valueFistulaBilDebitDiari) {
          await frame.select(
            basicParseID(HTML_IDS_LIVER.COMPL_ESPECIFIQUES.GRAU_FIST_BIL.ID),
            HTML_IDS_LIVER.COMPL_ESPECIFIQUES.GRAU_FIST_BIL.VALUES[
              NoSiParse(valueFistulaBilGrau)
            ]
          );
          await frame.$eval(
            basicParseID(
              HTML_IDS_LIVER.COMPL_ESPECIFIQUES.DEBIT_DIARI_MAX_FUGA_BIL
            ),
            (el: any, FROM) => (el.value = FROM),
            valueFistulaBilDebitDiari
          );
        }
        await frame.select(
          basicParseID(
            HTML_IDS_LIVER.COMPL_ESPECIFIQUES.COLECCIO_INTRAABOMINAL_DRENATGE.ID
          ),
          HTML_IDS_LIVER.COMPL_ESPECIFIQUES.COLECCIO_INTRAABOMINAL_DRENATGE
            .VALUES[NoSiParse(valueCalDrenatge)]
        );
        await frame.select(
          basicParseID(
            HTML_IDS_LIVER.COMPL_ESPECIFIQUES
              .HEMOPERITONEU_POST_IQ_REINTERVENCIO.ID
          ),
          HTML_IDS_LIVER.COMPL_ESPECIFIQUES.HEMOPERITONEU_POST_IQ_REINTERVENCIO
            .VALUES[NoSiParse(valueHemoper)]
        );

        await frame.select(
          basicParseID(HTML_IDS_LIVER.COMPL_ESPECIFIQUES.ASCITIS.ID),
          HTML_IDS_LIVER.COMPL_ESPECIFIQUES.ASCITIS.VALUES[
            NoSiParse(valueAscitis)
          ]
        );

        // frame.waitForNavigation();

        // *****************
        // Compl PostIQ
        // ---- UCI
        // *****************

        const clavienGrau = currentObservation[HEADERS_LIVER_DDBB.GRAUCLAVIEN];
        const valueEstadaUCIREA =
          clavienGrau &&
          (clavienGrau === "IVa" ||
            clavienGrau === "IVb" ||
            clavienGrau === "V"); // PK: !! Causa REIQ??? || Grau Clavien Dindo  >= 4
        const valueTempsUCIREA = "0"; // PK: induir:  Temps normal d'estada + alta ????
        const valueREIQ = currentObservation[HEADERS_LIVER_DDBB.REIQ];
        const valueDataREIQ = "00/00/2000";
        const valueMotiuREIQ = "PER_COMPLICACIO"; //! PK: Sempre será per Altres Complicacions postOp ???

        const valueMorbilitat = "SI";

        await frame.select(
          basicParseID(
            HTML_IDS_LIVER.COMPL_UCI_REINT_POST_IQ.ESTADA_UCI_REA.ID
          ),
          HTML_IDS_LIVER.COMPL_UCI_REINT_POST_IQ.ESTADA_UCI_REA.VALUES[
            valueEstadaUCIREA ? "SI" : "NO"
          ]
        );

        if (valueEstadaUCIREA)
          await frame.$eval(
            basicParseID(
              HTML_IDS_LIVER.COMPL_UCI_REINT_POST_IQ.TEMPS_UCI_REA_DIES
            ),
            (el: any, value) => (el.value = value),
            valueTempsUCIREA
          );

        await frame.select(
          basicParseID(HTML_IDS_LIVER.COMPL_UCI_REINT_POST_IQ.REINT_90_DIES.ID),
          HTML_IDS_LIVER.COMPL_UCI_REINT_POST_IQ.REINT_90_DIES.VALUES[
            NoSiParse(valueREIQ)
          ]
        );
        if (valueREIQ === "Si")
          await Promise.all([
            frame.$eval(
              basicParseID(
                HTML_IDS_LIVER.COMPL_UCI_REINT_POST_IQ.DATA_REINT_90_DIES
              ),
              (el: any, FROM) => (el.value = FROM),
              valueDataREIQ
            ),
            frame.select(
              basicParseID(
                HTML_IDS_LIVER.COMPL_UCI_REINT_POST_IQ.MOTIU_REINT_90_DIES.ID
              ),
              HTML_IDS_LIVER.COMPL_UCI_REINT_POST_IQ.MOTIU_REINT_90_DIES.VALUES[
                valueMotiuREIQ
              ]
            ),
          ]);

        await frame.select(
          basicParseID(HTML_IDS_LIVER.COMPL_MORBI_MORTALITAT.ID),
          HTML_IDS_LIVER.COMPL_MORBI_MORTALITAT.VALUES[valueMorbilitat]
        );
      }
    } catch (e) {
      console.error("!!!!!!", e);
    }

    // *****************
    // AP
    //
    // *****************

    try {
      const valueAffMargeResAP = currentObservation[HEADERS_LIVER_DDBB.INVMARG];
      const valueDistMargeResAP =
        Math.round(
          parseInt(currentObservation[HEADERS_LIVER_DDBB.MARGEN])
        ).toString() || "0";
      const valueNumMetAP = currentObservation[HEADERS_LIVER_DDBB.NMETAP] || 0;
      const valueMidaMaxMetAP = Math.round(
        (parseInt(currentObservation[HEADERS_LIVER_DDBB.MIDAAP]) || 0) * 10
      ).toString();

      await frame.select(
        basicParseID(HTML_IDS_LIVER.AP.AFFECT_MARGE_RESSECCIO.ID),
        HTML_IDS_LIVER.AP.AFFECT_MARGE_RESSECCIO.VALUES[
          NoSiParse(valueAffMargeResAP)
        ]
      );

      if (valueAffMargeResAP && valueDistMargeResAP)
        await frame.$eval(
          basicParseID(HTML_IDS_LIVER.AP.DIST_MARGE_RESSECCIO),
          (el: any, value) => (el.value = value),
          valueDistMargeResAP
        );
      await frame.$eval(
        basicParseID(HTML_IDS_LIVER.AP.NUMERO_MH),
        (el: any, value) => (el.value = value),
        valueNumMetAP
      );
      await frame.$eval(
        basicParseID(HTML_IDS_LIVER.AP.MAJOR_MH),
        (el: any, value) => (el.value = value),
        valueMidaMaxMetAP
      );
    } catch (e) {
      console.error("!!!!!!", e);
    }

    // *****************
    // Estat final
    // *****************

    try {
      const valueDarrerControl = formatDate(
        currentObservation[HEADERS_LIVER_DDBB.DATAULTCONT]
      ); // PK, es correcte?
      const _estatPacient = currentObservation[HEADERS_LIVER_DDBB.ESTAT];
      const valueEstat: keyof typeof HTML_IDS_LIVER.ESTAT_FINAL_PACIENT.ESTAT_PACIENT.VALUES =
        _estatPacient === "Viu"
          ? "VIU"
          : _estatPacient === "Mort (lliure malaltia)"
          ? "EXITUS"
          : _estatPacient === "Perdut"
          ? "PERDUA_SEGUIMENT"
          : "PERDUA_SEGUIMENT";
      const valueExitusData =
        formatDate(currentObservation[HEADERS_LIVER_DDBB.DataEXITUS]) ||
        "00/00/2000";

      // Causa exitus:
      const _perComplPostOP =
        currentObservation[HEADERS_LIVER_DDBB.MORTALITAT] === "Si";
      const _perRecidiva =
        currentObservation[HEADERS_LIVER_DDBB.RECHEP] === "Si"; //?? PK
      const _recidibaPulmonar = currentObservation[HEADERS_LIVER_DDBB.RECPUL]; //?? PK
      const _perProgressioTumoral =
        _recidibaPulmonar && _recidibaPulmonar.includes("Progressió");

      const valueCausaExitus: keyof typeof HTML_IDS_LIVER.ESTAT_FINAL_PACIENT.CAUSA_EXITUS.VALUES =
        _perProgressioTumoral
          ? "MALALT_TUMOR_PROGRESSIO"
          : _perRecidiva
          ? "MALALT_TUMOR_RECIDIVA"
          : _perComplPostOP
          ? "COMPL_POSTOP"
          : "ALTRES";

      await frame.$eval(
        basicParseID(HTML_IDS_LIVER.ESTAT_FINAL_PACIENT.DATA_ULT_CONTROL),
        (el: any, value) => (el.value = value),
        valueDarrerControl
      );

      await frame.select(
        basicParseID(HTML_IDS_LIVER.ESTAT_FINAL_PACIENT.ESTAT_PACIENT.ID),
        HTML_IDS_LIVER.ESTAT_FINAL_PACIENT.ESTAT_PACIENT.VALUES[valueEstat]
      );

      if (valueEstat === "EXITUS" && valueExitusData)
        await frame.$eval(
          basicParseID(HTML_IDS_LIVER.ESTAT_FINAL_PACIENT.DATA_EXITUS),
          (el: any, value) => (el.value = value),
          valueExitusData
        );

      if (valueEstat === "EXITUS" && valueCausaExitus)
        await frame.select(
          basicParseID(HTML_IDS_LIVER.ESTAT_FINAL_PACIENT.CAUSA_EXITUS.ID),
          HTML_IDS_LIVER.ESTAT_FINAL_PACIENT.CAUSA_EXITUS.VALUES[
            valueCausaExitus
          ]
        );
    } catch (e) {
      console.error("!!!!!!", e);
    }

    console.log("finished with obs nº: ", i);
    console.log("NHC: ", currentNHC);

    registerCurrentObservationNumber(i);
    await addToCompletedList(currentObservation);
    console.log(currentNHC, " added to completed register");
    console.log("SAVING AND GOING TO SEARCH FORM");

    await saveForm(frame);
    await goBackFromList(frame);

    // await frame.waitForSelector(TEXT_INPUT_FROM_DATE);

    // GOBACK METHODS
    // METHOD 1:
    // await pages[0].reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
    // METHOD 2:
    // await goBackFromForm(frame);
    // await goBackFromList(frame);
  }
};

// getScrappingData();

const basicParseID = (noParsedId: string) => {
  return "#" + noParsedId.replace(":", "\\3A ");
};

const NoSiParse = (val: string) =>
  val === "No" ? "NO" : val === "Si" ? "SI" : "NOCONSTA";

function addDaysToMilisecondsAndGetDate(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const parseDateToMiliseconds = (date: Date): number =>
  date ? date.getTime() + 3600000 : 0;

const formatDate = (date: Date | number) => {
  return moment(date).format("DD/MM/yyyy");
};

const addToUncompletedList = async (
  currentObservation: any,
  errorType: string
) => {
  const ddbbData = await parseXlsx2(
    "register/uncompletedRegister",
    "uncompletedRegister"
  );

  const timestamp = new Date(Date.now());

  buildXlsxFile2(
    "uncompletedRegister",
    [...(ddbbData as any[]), { ...currentObservation, timestamp, errorType }],
    "register"
  );
};

const addToCompletedList = async (currentObservation: any) => {
  const ddbbData = await parseXlsx2(
    "register/completedRegister",
    "completedRegister"
  );

  const timestamp = new Date(Date.now());

  buildXlsxFile2(
    "completedRegister",
    [...ddbbData, { ...currentObservation, timestamp }],
    "register"
  );
};

const registerCurrentObservationNumber = (currentObsNum: number) => {
  fs.writeFileSync(
    "register/lastObservationNum.txt",
    currentObsNum.toString(),
    "utf-8"
  );

  console.log("Registered last obs num: ", currentObsNum);
};
const readLastObservationNumber = (): number => {
  // where we left the work
  return parseInt(fs.readFileSync("register/lastObservationNum.txt", "utf-8"));
};

const iterationCCIEstimation = (
  currentIterationValue: number,
  targetCCI: number,
  errorMargin: number
) => {
  if (targetCCI > currentIterationValue) {
    const stepSize = (targetCCI - currentIterationValue) / (1 + errorMargin);
    return currentIterationValue + stepSize;
  }

  if (targetCCI < currentIterationValue) {
    const stepSize = (targetCCI - currentIterationValue) / (1 + errorMargin);
    return currentIterationValue - stepSize;
  }
};

type ClavienDindoCountType = {
  gradeI: number;
  gradeII: number;
  gradeIIIa: number;
  gradeIIIb: number;
  gradeIVa: number;
  gradeIVb: number;
};
type ClavienDindoGrades =
  | "gradeI"
  | "gradeII"
  | "gradeIIIa"
  | "gradeIIIb"
  | "gradeIVa"
  | "gradeIVb";

type ClavienDindoCountArrType = {
  name: ClavienDindoGrades;
  index: number;
  count: number;
}[];

interface ClavienDindoWeights {
  [index: string]: number; // types not working here for indexing on .reduce ?
}

const computeClavienDindo = (
  ClavienDindoCountArr: ClavienDindoCountArrType
): number => {
  // returns CCI
  const WEIGHTS: ClavienDindoWeights = {
    gradeI: 300,
    gradeII: 1750,
    gradeIIIa: 2750,
    gradeIIIb: 4550,
    gradeIVa: 7200,
    gradeIVb: 8550,
  };

  const weightedValueArrRes = ClavienDindoCountArr.reduce(
    (prev, current) => prev + current.count * WEIGHTS[current.name],
    0
  );

  return Math.sqrt(weightedValueArrRes / 2);
};

const estimateCCIInBaseMaxClavienAndTargetCCI = (
  maxClavien: ClavienDindoGrades,
  targetCCI: number,
  currentIterationValue = 0
): ClavienDindoCountArrType => {
  // returns: clavien dindo combinations!
  const errorMargin = 0.1;

  const currentClavien = maxClavien;

  let ClavienGradesCount: ClavienDindoCountArrType = [
    // will be only one
    { name: "gradeI", index: 1, count: maxClavien === "gradeI" ? 1 : 0 },
    { name: "gradeII", index: 2, count: maxClavien === "gradeII" ? 1 : 0 },
    { name: "gradeIIIa", index: 3, count: maxClavien === "gradeIIIa" ? 1 : 0 },
    { name: "gradeIIIb", index: 4, count: maxClavien === "gradeIIIb" ? 1 : 0 },
    { name: "gradeIVa", index: 5, count: maxClavien === "gradeIVa" ? 1 : 0 },
    { name: "gradeIVb", index: 6, count: maxClavien === "gradeIVb" ? 1 : 0 },
  ];

  console.log("ClavienGradesCount before correction: ", ClavienGradesCount);
  currentIterationValue = computeClavienDindo(ClavienGradesCount);

  let isNextToTarget = false;
  const upperBoundary = targetCCI * (1 + errorMargin);
  const lowerBoundary = targetCCI / (1 + errorMargin);

  const isIntoUpperBoundary = currentIterationValue < upperBoundary;
  const isIntoLowerBoundary = currentIterationValue > lowerBoundary;

  isNextToTarget =
    currentIterationValue === targetCCI ||
    (isIntoLowerBoundary && isIntoUpperBoundary);

  if (isNextToTarget) return ClavienGradesCount;

  let newValue = currentIterationValue;

  if (targetCCI > currentIterationValue) {
    const reversedGrades = ClavienGradesCount.slice().reverse();

    for (let jx = 0; jx < reversedGrades.length; jx++) {
      const currentGrade = reversedGrades[jx];
      if (currentGrade.count === 0) {
      } else {
        const foundValue = ClavienGradesCount.find(
          (item) => item.name === currentGrade.name
        );
        ++foundValue.count;
      }
    }

    console.log("ClavienGradesCount after correction: ", ClavienGradesCount);
  }

  if (targetCCI < currentIterationValue) {
    const stepSize = (targetCCI - currentIterationValue) / (1 + errorMargin);
    newValue -= stepSize;
  }

  const isNewValueIntoUpperBoundary = newValue < upperBoundary;
  const isNewValueIntoLowerBoundary = newValue > lowerBoundary;

  const isNewValueNextToTarget =
    newValue === targetCCI ||
    (isNewValueIntoUpperBoundary && isNewValueIntoLowerBoundary);

  if (!isNewValueNextToTarget) {
    return;
    estimateCCIInBaseMaxClavienAndTargetCCI(maxClavien, targetCCI, newValue);
  } else {
    return;
  }
};

estimateCCIInBaseMaxClavienAndTargetCCI("gradeIIIa", 70);

// const ShowEditFunctionalities = async (frame: puppeteer.Frame) => {
//   const elements = await frame.$$('input[type="text"]');

//   elements.forEach(async (el) => {
//     const properties = await (await el.getProperties()).entries() as Map<any, any>
//     for (const [key, value] of properties) {
//       console.log("key is: ", key);
//       console.log("value is: ", value);
//     }
//   });
//   // console.log("el: ", await GetProperty(el, "innerHTML"));

//   // const elId = await (await el.getProperty("id")).asElement;
//   // console.log("elId: ", elId);

//   // frame.$eval(elId, (eli) => (eli.value = "nnot"));
// };

// const GetProperty = async (
//   element: puppeteer.ElementHandle,
//   property: string
// ): Promise<string> => {
//   return await (await element.getProperty(property)).jsonValue();
// };

// TODOS:
/*
- Add registers for "NO CONSTA" and errors in variables or code: think of reusable code

POTENTIAL UNHANDLED ERRORS:
- sesion expired while inputing data (Hi ha hagut un problema demanant les dades) 
*/
