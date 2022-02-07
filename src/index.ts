import puppeteer from "puppeteer";
import xlsx, { WorkSheet } from "node-xlsx";
import fs, { unwatchFile } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
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
  wsChromeEndpointurl = "ws://127.0.0.1:9222/devtools/browser/d54cf110-e709-422a-855d-d1e7d487701a",
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
    } catch (e) {
      console.error("Unable to complete form search input data ");
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

const goBackFromForm = async (frame: puppeteer.Frame) => {
  await Promise.all([
    frame.waitForSelector(BUTTON_BACK_FORM),
    frame.$eval(BUTTON_BACK_FORM, (el: any) => el.click()),
    frame.waitForNavigation({ waitUntil: "networkidle2" }),
  ]);
};

const getScrappingData = async () => {
  const ddbbData = await parseXlsx2("output/crossedData2", "crossedData2");
  const HEADERS = ddbbData.shift();

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

  for (let i = 2; i < 3; i++) {
    const errors = [];

    const currentObservation = ddbbData[i];
    const currentNHC = currentObservation[HEADERS_LIVER_DDBB.SAP];

    console.log("current sap:", currentNHC);

    console.log(
      "currentObservation[HEADERS_LIVER_DDBB.DATAHEP]",
      currentObservation[HEADERS_LIVER_DDBB.DATAHEP]
    );

    let ValueDataIngres = parseDateToMiliseconds(
      new Date(currentObservation[HEADERS_LIVER_DDBB.DATAHEP])
    );

    const ValueDataIQ = ValueDataIngres;

    const ValueDataDiagnostic = addDaysToMilisecondsAndGetDate(
      ValueDataIngres,
      -50
    ); // !!

    const Estada = currentObservation[HEADERS_LIVER_DDBB.ESTADA];
    console.log("estada is: ", Estada);

    const ValueDataAlta = addDaysToMilisecondsAndGetDate(
      ValueDataIngres,
      parseInt(Estada)
    );

    console.log("next");
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
      errors.push("Falta alguna variable, revisar");
      continue;
    }

    // const ValueTractamentHepatic = wasIQ ?

    // continue;
    // if (false)
    if ((await ExecutePuppeteerSearch(frame, currentNHC)) !== "LOADED") {
      console.error("somet hing went wrong");
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

    // if (false) {
    try {
      const IsFormClosed_ID = HTML_IDS_LIVER.TANCAMENT_REGISTRE_DADES;
      await frame.$eval(IsFormClosed_ID, (el: any) => {
        if (el.value === "true") {
          el.click();
        }
      });

      // await frame.waitForNavigation({ waitUntil: "networkidle2" });
    } catch (e) {
      console.error("Tancament registre func error");
      console.error(e);
    }
    // }

    // START INPUTING DATA
    console.log("_____________________");
    console.log("START INPUTING DATA");
    console.log("_____________________");

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
      errors.push("Error en alguna fechas formateadas, revisar");
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

    console.log("ValueCMDAbans: ", ValueCMDAbans);

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
      errors.push("Error en alguna variable de CMD, revisar");
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
      // console.log("0 gonna wait for navigation");

      // await frame.waitForNavigation({ waitUntil: "networkidle2" });
      // console.log("0 waited for navigation");
    } catch (e) {
      console.error(
        "unable to complete promise all for CMD data before condition, error message: "
      );
      console.error(e);
    }

    //____TODO: TEST THIS CONDITION____

    if (ValueCMDAbans === "SI") {
      try {
        // await Promise.all([
        //   frame.waitForSelector(HTML_IDS_LIVER.TEXT_DATA_CMD_ABANS),
        //   frame.waitForSelector(HTML_IDS_LIVER.INFORME_CMD_ABANS.ID),
        // ]);

        await Promise.all([
          frame.$eval(
            HTML_IDS_LIVER.TEXT_DATA_CMD_ABANS,
            (el: any) => (el.value = ValueCMDAbansData)
          ),
          frame.select(
            HTML_IDS_LIVER.INFORME_CMD_ABANS.ID,
            HTML_IDS_LIVER.INFORME_CMD_ABANS.VALUES[ValueCMDInforme]
          ),
        ]);
      } catch (e) {
        console.error(
          "unable to complete promise all for CMD data after condition CMD = true, error message: "
        );
        console.error(e);
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

    console.log("strValueRadio: ", strValueRadio);
    console.log("strValueMW: ", strValueMW);

    if (!ValueTecnica || !strValueRadio || !strValueMW) {
      errors.push("Faltan varaibles de Tecnica IQ");
    }

    const ValueRadio = strValueRadio === "Si" ? true : false;
    const ValueMW = strValueMW === "Si" ? true : false;

    console.log("ValueRadio: ", ValueRadio);
    console.log("ValueMW: ", ValueMW);

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

      console.log("1. gonna wait for navigation");
      frame.waitForNavigation();

      // await frame.waitForNavigation(); // formulary might change
      console.log("1. waited for navigation");
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
    console.log("Conversio:", Conversio);
    console.log("Conversio:", Conversio);

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
    const MHMajorDiam = (
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
    const tipusReseccioMH = _tipusReseccioMH.includes("ampliada")
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
            affBilob === "Si" ? "SI" : affBilob === "No" ? "NO" : "NOCONSTA"
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
        const valueInsufHepatica =
          currentObservation[HEADERS_LIVER_DDBB.INSUFHEPisgls];
        const valueInsufHepaticaGrau =
          currentObservation[HEADERS_LIVER_DDBB.GrauIH];
        const valueFistulaBil = currentObservation[HEADERS_LIVER_DDBB.FISTBILI];
        const valueFistulaBilGrau =
          currentObservation[HEADERS_LIVER_DDBB.GRAUFB];
        const valueFistulaBilDebitDiari = 0;
        const valueCalDrenatge =
          currentObservation[HEADERS_LIVER_DDBB.INFESPAI];
        const valueHemoper = currentObservation[HEADERS_LIVER_DDBB.HEMOPER];
        const valueAscitis = currentObservation[HEADERS_LIVER_DDBB.ASCITIS];

        await Promise.all([
          frame.select(
            basicParseID(HTML_IDS_LIVER.COMPL_ESPECIFIQUES.INSF_HEPATICA.ID),
            HTML_IDS_LIVER.COMPL_ESPECIFIQUES.INSF_HEPATICA.VALUES[
              NoSiParse(valueInsufHepatica)
            ]
          ),
          frame.select(
            basicParseID(HTML_IDS_LIVER.COMPL_ESPECIFIQUES.GRAU_INSF_HEP.ID),
            HTML_IDS_LIVER.COMPL_ESPECIFIQUES.GRAU_INSF_HEP.VALUES[
              NoSiParse(valueInsufHepaticaGrau)
            ]
          ),
          frame.select(
            basicParseID(HTML_IDS_LIVER.COMPL_ESPECIFIQUES.FISTULA_BILIAR.ID),
            HTML_IDS_LIVER.COMPL_ESPECIFIQUES.FISTULA_BILIAR.VALUES[
              NoSiParse(valueFistulaBil)
            ]
          ),
          frame.select(
            basicParseID(HTML_IDS_LIVER.COMPL_ESPECIFIQUES.GRAU_FIST_BIL.ID),
            HTML_IDS_LIVER.COMPL_ESPECIFIQUES.GRAU_FIST_BIL.VALUES[
              NoSiParse(valueFistulaBilGrau)
            ]
          ),
          frame.$eval(
            HTML_IDS_LIVER.COMPL_ESPECIFIQUES.DEBIT_DIARI_MAX_FUGA_BIL,
            (el: any, FROM) => (el.value = FROM),
            valueFistulaBilDebitDiari
          ),
          frame.select(
            basicParseID(
              HTML_IDS_LIVER.COMPL_ESPECIFIQUES.COLECCIO_INTRAABOMINAL_DRENATGE
                .ID
            ),
            HTML_IDS_LIVER.COMPL_ESPECIFIQUES.COLECCIO_INTRAABOMINAL_DRENATGE
              .VALUES[NoSiParse(valueCalDrenatge)]
          ),
          frame.select(
            basicParseID(
              HTML_IDS_LIVER.COMPL_ESPECIFIQUES
                .HEMOPERITONEU_POST_IQ_REINTERVENCIO.ID
            ),
            HTML_IDS_LIVER.COMPL_ESPECIFIQUES
              .HEMOPERITONEU_POST_IQ_REINTERVENCIO.VALUES[
              NoSiParse(valueHemoper)
            ]
          ),

          frame.select(
            basicParseID(HTML_IDS_LIVER.COMPL_ESPECIFIQUES.ASCITIS.ID),
            HTML_IDS_LIVER.COMPL_ESPECIFIQUES.ASCITIS.VALUES[
              NoSiParse(valueAscitis)
            ]
          ),
        ]);
        frame.waitForNavigation();
      }
    } catch (e) {
      console.error("!!!!!!", e);
    }

    console.log("finished with number: ", i);

    // GOBACK METHODS
    // METHOD 1:
    // await pages[0].reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
    // METHOD 2:
    // await goBackFromForm(frame);
    // await goBackFromList(frame);
  }
};

getScrappingData();

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
  console.log("date is: ", date);

  return moment(date).format("DD/MM/yyyy");
};

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
