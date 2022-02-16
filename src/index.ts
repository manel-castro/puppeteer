import puppeteer from "puppeteer";

import fs from "fs";

import { fileURLToPath } from "url";
import { buildXlsxFile2, HEADERS_LIVER_DDBB } from "./crossExcelsGood";
import moment from "moment";

import { INTERFACE_IDS } from "./consts/general";
import { HTML_IDS_LIVER, NOSINOC, NOSINOCType } from "./consts/fetge";

import { parseXlsx2 } from "./crossExcelsGood";
import {
  cNtype,
  cTNMRelationsAdenocarcinoma,
  cTNMRelationsSquamousCarcinoma,
  cTNMType,
  cTtype,
  pDifferentiationGradeType,
  pNtype,
  pTNMRelationsAdenocarcinoma,
  pTNMType,
  pTtype,
  ypNtype,
  ypTNMRelations,
  ypTNMType,
  ypTtype,
} from "./consts/TNMRelations";
import { getJsFormatFromOddDate } from "./crossExcels";

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

const PuppeteerDeleteAndType = async (
  frame: puppeteer.Frame,
  element: string,
  value: string
) => {
  // done since This shitty form has some way to control when Typed / scrolled / clciked
  try {
    await frame.$eval(element, (el: any, value) => (el.value = value), "");

    await frame.type(element, value);
  } catch (e) {
    console.error("SOMETHING WENT WRONG WITH PUPPETEER DELETE AND TYPE: ");
    console.error(e);
  }
};

type InterfacePuppeteerSetupRes = {
  browser: puppeteer.Browser;
  pages: puppeteer.Page[];
  frame: puppeteer.Frame;
};

const getInterfacePuppeteerSetup = (
  wsChromeEndpointurl = "ws://127.0.0.1:9222/devtools/browser/2eeff6af-ec89-4372-a60b-bd5e1020c24e",
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
  const saveEl = await frame.$(saveButtID);
  await frame.waitForTimeout(2000);

  await Promise.all([
    frame.waitForSelector(saveButtID),
    saveEl.click(),
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
  const ddbbData = await parseXlsx2("output/crossedData3", "crossedData3");

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

  for (let i = 0; i < 11; i++) {
    // await registerCurrentObservationNumber(i);
    const errors = [];
    console.log("i");

    const currentObservation = ddbbData[i];

    const currentNHC = currentObservation[HEADERS_LIVER_DDBB.SAP];
    const currentLastName = currentObservation[HEADERS_LIVER_DDBB.APELLIDO1];
    const isSecondObs = currentLastName.includes("2");

    if (currentNHC != 10207678) continue;
    console.log("name is: ", currentLastName);

    if (isSecondObs && false) {
      console.log("ommiting, is second observation");

      await addToUncompletedList(currentObservation, "Is Second Observation");
      continue;
    }

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

    const ValueDataDiagnostic =
      currentObservation[HEADERS_LIVER_DDBB.FECHATACRM];

    // addDaysToMilisecondsAndGetDate(
    //   ValueDataIngres,
    //   -50
    // ); // !!

    const ValueEstada = currentObservation[HEADERS_LIVER_DDBB.ESTADA] || "2"; // minim temps d'estada?

    console.log("ValueEstada: ", ValueEstada);
    console.log("parseInt(ValueEstada): ", parseInt(ValueEstada));

    const ValueDataAlta = addDaysToMilisecondsAndGetDate(
      ValueDataIngres,
      parseInt(ValueEstada)
    );

    // !! estada not always defined

    const ValueEdatIQ = currentObservation[HEADERS_LIVER_DDBB.EDAT];
    const ValuePes =
      currentObservation[HEADERS_LIVER_DDBB.PES]?.toString() || "999"; //??
    const ValueTalla =
      currentObservation[HEADERS_LIVER_DDBB.Talla]?.toString() || "999"; //??
    const ValueASA = currentObservation[HEADERS_LIVER_DDBB.ASA];
    const ValueEcog = "NO-VALORAT"; //??
    const ValueEras = "NO"; //??

    if (!ValuePes || !ValueTalla || !ValueASA) {
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
    const currentItemId = LINK_LIST_ITEM(0);
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
          if (value) {
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

    const DataDiagnosticInOddFormat = ValueDataDiagnostic;

    const DataIQInOddFormat = formatDate(ValueDataIQ);

    if (
      !DataAltaInOddFormat ||
      !DataDiagnosticInOddFormat ||
      !DataIQInOddFormat ||
      !DataIngresInOddFormat
    ) {
      const errorMessage = "Error en alguna fechas formateadas, revisar";
      console.log(currentNHC, errorMessage);

      errors.push(errorMessage);
      addToUncompletedList(currentObservation, errorMessage);
      continue;
    }
    // if (false)

    try {
      // CHECK VALUES OF ASA WITH EXISTING FORM
      await PuppeteerDeleteAndType(
        frame,
        DATA_INGRES,

        DataIngresInOddFormat
      );
      await PuppeteerDeleteAndType(
        frame,
        DATA_ALTA,

        DataAltaInOddFormat
      );
      await PuppeteerDeleteAndType(
        frame,
        DATA_DIAGNOSTIC,

        DataDiagnosticInOddFormat
      );
      await PuppeteerDeleteAndType(
        frame,
        DATA_IQ,

        DataIQInOddFormat
      );
      // AGE CALCULATED AUTOMATICALLY
      // await PuppeteerDeleteAndType(
      //   frame,
      //   EDAT_IQ,

      //   ValueEdatIQ
      // );
      await PuppeteerDeleteAndType(frame, PES_KG, ValuePes);
      await PuppeteerDeleteAndType(frame, TALLA_CM, ValueTalla);

      // frame.waitForNavigation({ waitUntil: "networkidle2" }),
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

    const ValueFecha1rCMD = currentObservation[HEADERS_LIVER_DDBB.FECHA1RCMD];
    console.log("ValueFecha1rCMD: ", ValueFecha1rCMD);
    // console.log("formatDate(ValueFecha1rCMD): ", formatDate(ValueFecha1rCMD));

    const ValueFechaUltCMD = currentObservation[HEADERS_LIVER_DDBB.FECHAULTCMD];
    const _locTumor = currentObservation[HEADERS_LIVER_DDBB.LOCTUMOR];

    const ValueCMDAbans =
      currentObservation[HEADERS_LIVER_DDBB.COMITE]?.toUpperCase() ||
      "NOCONSTA";

    const ValueCMDInforme = ValueCMDAbans;
    const ValueCMDAbansData = ValueFecha1rCMD;

    // next code can only work if ValueDataDiagnostic still not formated
    // ValueCMDAbans
    //   ? formatDate(
    //       addDaysToMilisecondsAndGetDate(
    //         ValueDataDiagnostic,
    //         +(Math.random() * (14 - 5) + 14)
    //       )
    //     )
    //   : ""; // !!  2 months before aprox
    console.log("ValueFechaUltCMD: ", ValueFechaUltCMD);
    console.log(
      "ValueFechaUltCMD: ",
      new Date(getJsFormatFromOddDate(ValueFechaUltCMD))
    );

    const ValueCMDAfter: keyof NOSINOCType = !ValueFechaUltCMD
      ? "NOCONSTA"
      : new Date(getJsFormatFromOddDate(ValueFechaUltCMD)).getTime() >
        ValueDataIngres
      ? "SI"
      : "NO"; // !!

    console.log(
      "new Date(ValueFechaUltCMD).getTime(): ",
      new Date(ValueFechaUltCMD).getTime()
    );
    console.log("ValueDataIngres: ", ValueDataIngres);

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

        await PuppeteerDeleteAndType(
          frame,
          HTML_IDS_LIVER.TEXT_DATA_CMD_ABANS,

          ValueCMDAbansData
        );
        await frame.select(
          HTML_IDS_LIVER.INFORME_CMD_ABANS.ID,
          HTML_IDS_LIVER.INFORME_CMD_ABANS.VALUES[ValueCMDInforme]
        );
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

    const ValueRadio = strValueRadio.includes("Si") ? true : false;
    const ValueMW = strValueMW.includes("Si") ? true : false;

    const tecnicaIsQuirurgicUnicament =
      wasIQ &&
      ValueTecnica.includes("hepatectomia major") &&
      ValueTecnica.includes("resecció");

    const ValueTractamentHepátic: keyof typeof HTML_IDS_LIVER.TRACTAMENT_H.VALUES =
      ValueTecnica && !ValueRadio && !ValueMW
        ? "QUIRURGIC_ONLY" // no data for Locoregional Only, done by Hospitals without resources
        : ValueTecnica && (ValueRadio || ValueMW)
        ? "LOCOREGIONAL_AND_QUIRURGIC"
        : "LOCOREGIONAL_ONLY";

    console.log("ValueRadio: ", ValueRadio);
    console.log("ValueMW: ", ValueMW);
    console.log("tecnicaIsQuirurgicUnicament: ", tecnicaIsQuirurgicUnicament);
    console.log("ValueTractamentHepátic: ", ValueTractamentHepátic);

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

      if (
        ValueTractamentHepátic === "LOCOREGIONAL_AND_QUIRURGIC" ||
        ValueTractamentHepátic === "LOCOREGIONAL_ONLY"
      ) {
        await frame.select(
          basicParseID(HTML_IDS_LIVER.LOCOREGIONAL.ID),
          HTML_IDS_LIVER.LOCOREGIONAL.VALUES[
            ValueRadio ? "RF" : ValueMW ? "mw" : "NOCONSTA"
          ]
        );
      }

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

    const numMH = currentObservation[HEADERS_LIVER_DDBB.NMETIMAGpre].toString();
    const MHMajorDiam = Math.round(
      parseFloat(currentObservation[HEADERS_LIVER_DDBB.MIDAMHIMATGE]) * 10
    ).toString();

    try {
      await frame.select(
        HTML_IDS_LIVER.TUMOR_ORIGEN_MH.ID,
        HTML_IDS_LIVER.TUMOR_ORIGEN_MH.VALUES["CCR"]
      );
      await PuppeteerDeleteAndType(
        frame,
        HTML_IDS_LIVER.NUM_MH_DIAG,

        numMH
      );
      await PuppeteerDeleteAndType(
        frame,
        HTML_IDS_LIVER.DIAMETRE_MAJOR_MH,

        MHMajorDiam
      );
    } catch (e) {
      console.error("!!!!!!", e);
    }

    const RES2 = currentObservation[HEADERS_LIVER_DDBB.RES2];
    const RES3 = currentObservation[HEADERS_LIVER_DDBB.RES3];
    const numReseccPrev =
      RES3 && RES3 === "Si" ? "2" : RES2 && RES2 === "Si" ? "1" : "0";

    console.log("numReseccPrev: ", numReseccPrev);

    const affBilob = currentObservation[HEADERS_LIVER_DDBB.BILOBUL];
    console.log("affBilob", affBilob);

    await PuppeteerDeleteAndType(
      frame,
      HTML_IDS_LIVER.NUM_RESECCIONS_H_PREV,
      "0" + numReseccPrev
    );
    try {
      await frame.select(
        HTML_IDS_LIVER.AFECTACIO_BILOBULAR_MH.ID,
        HTML_IDS_LIVER.AFECTACIO_BILOBULAR_MH.VALUES[
          affBilob === "Si" ? "SI" : affBilob === "No" ? "NO" : "NOCONSTA"
        ]
      );
    } catch (e) {
      console.error("!!!!!!", e);
    }
    // break;

    // need to parse text
    const _valuesLOC =
      currentObservation[HEADERS_LIVER_DDBB.LOCTUMOR]?.split(",") || [];

    const valLocI = _valuesLOC.find((item) => item.trim() === "I")
      ? "SI"
      : "NO";
    const valLocII = _valuesLOC.find((item) => item.trim() === "II")
      ? "SI"
      : "NO";
    const valLocIII = _valuesLOC.find((item) => item.trim() === "III")
      ? "SI"
      : "NO";
    const valLocIV = _valuesLOC.find((item) => item.trim() === "IV")
      ? "SI"
      : "NO";
    const valLocV = _valuesLOC.find((item) => item.trim() === "V")
      ? "SI"
      : "NO";
    const valLocVI = _valuesLOC.find((item) => item.trim() === "VI")
      ? "SI"
      : "NO";
    const valLocVII = _valuesLOC.find((item) => item.trim() === "VII")
      ? "SI"
      : "NO";
    const valLocVIII = _valuesLOC.find((item) => item.trim() === "VIII")
      ? "SI"
      : "NO";

    try {
      await frame.select(
        basicParseID(HTML_IDS_LIVER.LOC_TUMOR_AL_DX.LOC_SEG_I.ID),
        HTML_IDS_LIVER.LOC_TUMOR_AL_DX.LOC_SEG_I.VALUES[valLocI]
      );
      await frame.select(
        basicParseID(HTML_IDS_LIVER.LOC_TUMOR_AL_DX.LOC_SEG_II.ID),
        HTML_IDS_LIVER.LOC_TUMOR_AL_DX.LOC_SEG_II.VALUES[valLocII]
      );
      await frame.select(
        basicParseID(HTML_IDS_LIVER.LOC_TUMOR_AL_DX.LOC_SEG_III.ID),
        HTML_IDS_LIVER.LOC_TUMOR_AL_DX.LOC_SEG_III.VALUES[valLocIII]
      );
      await frame.select(
        basicParseID(HTML_IDS_LIVER.LOC_TUMOR_AL_DX.LOC_SEG_IV.ID),
        HTML_IDS_LIVER.LOC_TUMOR_AL_DX.LOC_SEG_IV.VALUES[valLocIV]
      );
      await frame.select(
        basicParseID(HTML_IDS_LIVER.LOC_TUMOR_AL_DX.LOC_SEG_V.ID),
        HTML_IDS_LIVER.LOC_TUMOR_AL_DX.LOC_SEG_V.VALUES[valLocV]
      );
      await frame.select(
        basicParseID(HTML_IDS_LIVER.LOC_TUMOR_AL_DX.LOC_SEG_VI.ID),
        HTML_IDS_LIVER.LOC_TUMOR_AL_DX.LOC_SEG_VI.VALUES[valLocVI]
      );
      await frame.select(
        basicParseID(HTML_IDS_LIVER.LOC_TUMOR_AL_DX.LOC_SEG_VII.ID),
        HTML_IDS_LIVER.LOC_TUMOR_AL_DX.LOC_SEG_VII.VALUES[valLocVII]
      );
      await frame.select(
        basicParseID(HTML_IDS_LIVER.LOC_TUMOR_AL_DX.LOC_SEG_VIII.ID),
        HTML_IDS_LIVER.LOC_TUMOR_AL_DX.LOC_SEG_VIII.VALUES[valLocVIII]
      );
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

    const _grauClavien = currentObservation[HEADERS_LIVER_DDBB.GRAUCLAVIEN];
    const valueComplPostIQ = _grauClavien && parseInt(_grauClavien) !== 0;

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
        // ---- Clavien-Dindo
        // *****************

        const clavienGrau = currentObservation[HEADERS_LIVER_DDBB.GRAUCLAVIEN];
        const clavienDindoCCI = currentObservation[HEADERS_LIVER_DDBB.CCIndex];

        console.log("clavienGrau: ", clavienGrau);

        const clavienDindoEstimations =
          await estimateCCIInBaseMaxClavienAndTargetCCI(
            clavienGrau,
            clavienDindoCCI
          );
        console.log("clavienDindoEstimations: ", clavienDindoEstimations);
        await PuppeteerDeleteAndType(
          frame,
          basicParseID(HTML_IDS_LIVER.CLAVIEN_DINDO.GRAU_I),
          clavienDindoEstimations
            .find((item) => item.name === "I")
            .count.toString()
        );
        await PuppeteerDeleteAndType(
          frame,
          basicParseID(HTML_IDS_LIVER.CLAVIEN_DINDO.GRAU_II),
          clavienDindoEstimations
            .find((item) => item.name === "II")
            .count.toString()
        );
        await PuppeteerDeleteAndType(
          frame,
          basicParseID(HTML_IDS_LIVER.CLAVIEN_DINDO.GRAU_IIIA),
          clavienDindoEstimations
            .find((item) => item.name === "IIIa")
            .count.toString()
        );
        await PuppeteerDeleteAndType(
          frame,
          basicParseID(HTML_IDS_LIVER.CLAVIEN_DINDO.GRAU_IIIB),
          clavienDindoEstimations
            .find((item) => item.name === "IIIb")
            .count.toString()
        );
        await PuppeteerDeleteAndType(
          frame,
          basicParseID(HTML_IDS_LIVER.CLAVIEN_DINDO.GRAU_IVA),
          clavienDindoEstimations
            .find((item) => item.name === "IVa")
            .count.toString()
        );
        await PuppeteerDeleteAndType(
          frame,
          basicParseID(HTML_IDS_LIVER.CLAVIEN_DINDO.GRAU_IVB),
          clavienDindoEstimations
            .find((item) => item.name === "IVb")
            .count.toString()
        );
        await PuppeteerDeleteAndType(
          frame,
          basicParseID(HTML_IDS_LIVER.CLAVIEN_DINDO.GRAU_V),
          clavienDindoEstimations
            .find((item) => item.name === "V")
            .count.toString()
        );

        try {
        } catch (E) {
          const errorMessage = "clavien dindo wrong";
          console.error(errorMessage);
          console.error(E);
        }

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
        const valueFistulaBilDebitDiari = "999";
        const valueCalDrenatge =
          currentObservation[HEADERS_LIVER_DDBB.INFESPAI];
        const valueHemoper = currentObservation[HEADERS_LIVER_DDBB.HEMOPER];
        const valueAscitis = currentObservation[HEADERS_LIVER_DDBB.ASCITIS];

        await frame.select(
          basicParseID(HTML_IDS_LIVER.COMPL_ESPECIFIQUES.INSF_HEPATICA.ID),
          HTML_IDS_LIVER.COMPL_ESPECIFIQUES.INSF_HEPATICA.VALUES[
            NoSiParse(AsumeNoIfUnknown(valueInsufHepatica))
          ]
        );

        if (valueInsufHepatica === "SI" && valueInsufHepatica)
          await frame.select(
            basicParseID(HTML_IDS_LIVER.COMPL_ESPECIFIQUES.GRAU_INSF_HEP.ID),
            HTML_IDS_LIVER.COMPL_ESPECIFIQUES.GRAU_INSF_HEP.VALUES[
              valueInsufHepaticaGrau
            ]
          );
        await frame.select(
          basicParseID(HTML_IDS_LIVER.COMPL_ESPECIFIQUES.FISTULA_BILIAR.ID),
          HTML_IDS_LIVER.COMPL_ESPECIFIQUES.FISTULA_BILIAR.VALUES[
            NoSiParse(AsumeNoIfUnknown(valueFistulaBil))
          ]
        );
        if (valueFistulaBilGrau && valueFistulaBilDebitDiari) {
          await frame.select(
            basicParseID(HTML_IDS_LIVER.COMPL_ESPECIFIQUES.GRAU_FIST_BIL.ID),

            valueFistulaBilGrau.toString()
          );
          await PuppeteerDeleteAndType(
            frame,
            basicParseID(
              HTML_IDS_LIVER.COMPL_ESPECIFIQUES.DEBIT_DIARI_MAX_FUGA_BIL
            ),

            valueFistulaBilDebitDiari
          );
        }
        await frame.select(
          basicParseID(
            HTML_IDS_LIVER.COMPL_ESPECIFIQUES.COLECCIO_INTRAABOMINAL_DRENATGE.ID
          ),
          HTML_IDS_LIVER.COMPL_ESPECIFIQUES.COLECCIO_INTRAABOMINAL_DRENATGE
            .VALUES[NoSiParse(AsumeNoIfUnknown(valueCalDrenatge))]
        );
        await frame.select(
          basicParseID(
            HTML_IDS_LIVER.COMPL_ESPECIFIQUES
              .HEMOPERITONEU_POST_IQ_REINTERVENCIO.ID
          ),
          HTML_IDS_LIVER.COMPL_ESPECIFIQUES.HEMOPERITONEU_POST_IQ_REINTERVENCIO
            .VALUES[NoSiParse(AsumeNoIfUnknown(valueHemoper))]
        );

        await frame.select(
          basicParseID(HTML_IDS_LIVER.COMPL_ESPECIFIQUES.ASCITIS.ID),
          HTML_IDS_LIVER.COMPL_ESPECIFIQUES.ASCITIS.VALUES[
            NoSiParse(AsumeNoIfUnknown(valueAscitis))
          ]
        );

        // frame.waitForNavigation();

        // *****************
        // Compl PostIQ
        // ---- UCI
        // *****************

        const valueEstadaUCIREA =
          clavienGrau &&
          (clavienGrau === "IIIb" ||
            clavienGrau === "IVa" ||
            clavienGrau === "IVb" ||
            clavienGrau === "V"); // nomes hi ha un // PK: !! Causa REIQ??? || Grau Clavien Dindo  >= 4
        const valueTempsUCIREA = "0"; // PK: induir:  Temps normal d'estada + alta ????
        const valueREIQ = currentObservation[HEADERS_LIVER_DDBB.REIQ];
        const valueDataREIQ = "01/01/2025"; // nomes hi ha un // HO MIREM MANUAL SEPARAR-HO
        const valueMotiuREIQ = "PER_COMPLICACIO"; //! PK: Sempre será per Altres Complicacions postOp = Resposta -> SI

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
          await PuppeteerDeleteAndType(
            frame,
            basicParseID(
              HTML_IDS_LIVER.COMPL_UCI_REINT_POST_IQ.TEMPS_UCI_REA_DIES
            ),

            valueTempsUCIREA
          );

        await frame.select(
          basicParseID(HTML_IDS_LIVER.COMPL_UCI_REINT_POST_IQ.REINT_90_DIES.ID),
          HTML_IDS_LIVER.COMPL_UCI_REINT_POST_IQ.REINT_90_DIES.VALUES[
            NoSiParse(valueREIQ)
          ]
        );
        if (valueREIQ === "Si") {
          await PuppeteerDeleteAndType(
            frame,
            basicParseID(
              HTML_IDS_LIVER.COMPL_UCI_REINT_POST_IQ.DATA_REINT_90_DIES
            ),

            valueDataREIQ
          );
          await frame.select(
            basicParseID(
              HTML_IDS_LIVER.COMPL_UCI_REINT_POST_IQ.MOTIU_REINT_90_DIES.ID
            ),
            HTML_IDS_LIVER.COMPL_UCI_REINT_POST_IQ.MOTIU_REINT_90_DIES.VALUES[
              valueMotiuREIQ
            ]
          );
        }

        await frame.select(
          basicParseID(HTML_IDS_LIVER.COMPL_MORBI_MORTALITAT.ID),
          HTML_IDS_LIVER.COMPL_MORBI_MORTALITAT.VALUES[valueMorbilitat]
        );
      }
    } catch (e) {
      console.error("!!!!!!", e);
    }

    // break;

    // *****************
    // AP
    //
    // *****************

    try {
      const valueAffMargeResAP = currentObservation[HEADERS_LIVER_DDBB.INVMARG];
      const valueDistMargeResAP =
        Math.round(
          parseFloat(currentObservation[HEADERS_LIVER_DDBB.MARGEN])
        ).toString() || "0";
      const valueNumMetAP = currentObservation[HEADERS_LIVER_DDBB.NMETAP] || 0;

      console.log("valueNumMetAP: ", valueNumMetAP);

      const midaApStr = currentObservation[HEADERS_LIVER_DDBB.MIDAAP];
      console.log("midaApStr: ", midaApStr);

      const midaApIntMm = parseFloat(midaApStr) * 10;
      console.log("midaApIntMm: ", midaApIntMm);
      const midaApRoundedMm = Math.round(midaApIntMm);
      console.log("midaApRoundedMm: ", midaApRoundedMm);

      const valueMidaMaxMetAP = Math.round(
        (parseFloat(currentObservation[HEADERS_LIVER_DDBB.MIDAAP]) || 0) * 10
      ).toString();

      await frame.select(
        basicParseID(HTML_IDS_LIVER.AP.AFFECT_MARGE_RESSECCIO.ID),
        HTML_IDS_LIVER.AP.AFFECT_MARGE_RESSECCIO.VALUES[
          NoSiParse(valueAffMargeResAP)
        ]
      );

      if (valueAffMargeResAP && valueDistMargeResAP)
        await PuppeteerDeleteAndType(
          frame,
          basicParseID(HTML_IDS_LIVER.AP.DIST_MARGE_RESSECCIO),

          valueDistMargeResAP
        );

      await PuppeteerDeleteAndType(
        frame,
        basicParseID(HTML_IDS_LIVER.AP.NUMERO_MH),
        valueNumMetAP.toString()
      );

      await PuppeteerDeleteAndType(
        frame,
        basicParseID(HTML_IDS_LIVER.AP.MAJOR_MH),
        valueMidaMaxMetAP
      );
    } catch (e) {
      console.error("!!!!!!", e);
      const errorMessage = "Error with MidaAp or NumAp";
      await addToUncompletedList(currentObservation, errorMessage);
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
          : _estatPacient.includes("Mort")
          ? "EXITUS"
          : _estatPacient === "Perdut"
          ? "PERDUA_SEGUIMENT"
          : "PERDUA_SEGUIMENT";
      const valueExitusData =
        formatDate(currentObservation[HEADERS_LIVER_DDBB.DataEXITUS]) ||
        "01/01/2025";

      // Causa exitus:
      const _perComplPostOP = _grauClavien === "V"; // nomes clavien V
      const _perRecidiva = _estatPacient === "Mort (amb recidiva)";

      // currentObservation[HEADERS_LIVER_DDBB.RECHEP] === "Si"; //?? PK
      // const _recidibaPulmonar = currentObservation[HEADERS_LIVER_DDBB.RECPUL]; //?? PK

      // const _perProgressioTumoral = // no n'hi ha a la BBDD

      // _recidibaPulmonar && _recidibaPulmonar.includes("Progressió");

      // mort amb recidiva / tumor : estat == Mort (amb recidiva)
      // dintre d'aquestos:
      // recidiva == 3 = sempre ha tingut tumor => per progessio del tumor
      // recidiva == 1 = recidiva => per progessio recidiva
      // altres: altres

      const valueCausaExitus: keyof typeof HTML_IDS_LIVER.ESTAT_FINAL_PACIENT.CAUSA_EXITUS.VALUES =
        _perRecidiva
          ? "MALALT_TUMOR_RECIDIVA"
          : _perComplPostOP
          ? "COMPL_POSTOP"
          : "ALTRES";

      await PuppeteerDeleteAndType(
        frame,
        basicParseID(HTML_IDS_LIVER.ESTAT_FINAL_PACIENT.DATA_ULT_CONTROL),

        valueDarrerControl
      );

      await frame.select(
        basicParseID(HTML_IDS_LIVER.ESTAT_FINAL_PACIENT.ESTAT_PACIENT.ID),
        HTML_IDS_LIVER.ESTAT_FINAL_PACIENT.ESTAT_PACIENT.VALUES[valueEstat]
      );

      if (valueEstat === "EXITUS" && valueExitusData)
        await PuppeteerDeleteAndType(
          frame,
          basicParseID(HTML_IDS_LIVER.ESTAT_FINAL_PACIENT.DATA_EXITUS),

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

    await addToCompletedList(currentObservation);
    console.log(currentNHC, " added to completed register");
    console.log("SAVING AND GOING TO SEARCH FORM");

    frame.waitForNavigation({ waitUntil: "networkidle2" });
    break;
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
  !val ? "NOCONSTA" : val === "No" ? "NO" : val === "Si" ? "SI" : "NOCONSTA";

const AsumeNoIfUnknown = (val: string) => (val && val.length ? val : "No");

function addDaysToMilisecondsAndGetDate(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const parseDateToMiliseconds = (date: Date): number =>
  date ? date.getTime() + 3600000 : 0;

export const formatDate = (date: Date | number) => {
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

  // console.log("uncompleted Register: ", ddbbData);
  // console.log("completed data: ", currentObservation);

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

  // console.log("completed Register: ", ddbbData);
  // console.log("completed data: ", currentObservation);
  buildXlsxFile2(
    "completedRegister",
    [...ddbbData, { ...currentObservation, timestamp }],
    "register"
  );
};

const registerCurrentObservationNumber = async (currentObsNum: number) => {
  await fs.writeFileSync(
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
type ClavienDindoGrades = "I" | "II" | "IIIa" | "IIIb" | "IVa" | "IVb" | "V";

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
    I: 300,
    II: 1750,
    IIIa: 2750,
    IIIb: 4550,
    IVa: 7200,
    IVb: 8550,
  };

  const weightedValueArrRes = ClavienDindoCountArr.reduce(
    (prev, current) => prev + current.count * WEIGHTS[current.name],
    0
  );

  return Math.sqrt(weightedValueArrRes) / 2;
};

const estimateCCIInBaseMaxClavienAndTargetCCI = async (
  maxClavien: ClavienDindoGrades,
  targetCCI: number
): Promise<ClavienDindoCountArrType> => {
  console.log("inital targetCCI: ", targetCCI);

  // COULD BE OPTIMIZED USING MONTECARLO.
  // Integrate existing Python library: https://github.com/cdslaborg/paramonte
  // with BOA: https://medium.com/imgcook/boa-use-python-functions-in-node-js-8946d413fbe3

  const errorMargin =
    maxClavien === "I" ? 0.5 : maxClavien === "II" ? 0.3 : 0.05;

  let ClavienGradesCount: ClavienDindoCountArrType = [
    // will be only one
    { name: "I", index: 1, count: maxClavien === "I" ? 1 : 0 },
    { name: "II", index: 2, count: maxClavien === "II" ? 1 : 0 },
    { name: "IIIa", index: 3, count: maxClavien === "IIIa" ? 1 : 0 },
    { name: "IIIb", index: 4, count: maxClavien === "IIIb" ? 1 : 0 },
    { name: "IVa", index: 5, count: maxClavien === "IVa" ? 1 : 0 },
    { name: "IVb", index: 6, count: maxClavien === "IVb" ? 1 : 0 },
    { name: "V", index: 6, count: maxClavien === "V" ? 1 : 0 },
  ];

  if (maxClavien === "V") return ClavienGradesCount;

  maxClavien = maxClavien as ClavienDindoGrades;

  // save last value that doesn't fit (Start by the one which is maximum)
  let lastGrade = maxClavien;
  let isTargetAreaReached = false;

  const upperBoundary = targetCCI * (1 + errorMargin);
  const lowerBoundary = targetCCI / (1 + errorMargin);

  const isIntoLowerBoundary = (value: number) => value > lowerBoundary;
  const isIntoUpperBoundary = (value: number) => value < upperBoundary;

  // this will be a while
  let iteration = 0;
  while (iteration < 50) {
    ++iteration;
    // check if match, and return value.
    let isNextToTarget = false;

    const currentIterationValue = computeClavienDindo(ClavienGradesCount);

    isNextToTarget =
      currentIterationValue === targetCCI ||
      (isIntoLowerBoundary(currentIterationValue) &&
        isIntoUpperBoundary(currentIterationValue));

    if (isNextToTarget) {
      return ClavienGradesCount;
    }

    // Compute corrections

    const _testMatrix = await JSON.parse(JSON.stringify(ClavienGradesCount));
    const _testValue = _testMatrix.find((item) => item.name === lastGrade);
    ++_testValue.count;

    console.log("_testMatrix: ", _testMatrix);

    const testValue = computeClavienDindo(_testMatrix);

    const foundValue = ClavienGradesCount.find(
      (item) => item.name === lastGrade
    );

    if (testValue < targetCCI) {
      // add value and keep lastGrade

      ++foundValue.count;
    } else {
      console.log("testValue > targetCCI");

      //doesn't add value and decrease lastGrade
      // will check if already is in target area

      const nextIndex = foundValue.index - 1;

      if (nextIndex === 0) {
        return ClavienGradesCount;
      } else {
        lastGrade = ClavienGradesCount.find(
          (item) => item.index === nextIndex
        ).name;
      }
    }
  }
};

const computeIsBrisbane = (TECNICA: string, TecnicaQuir_descripció: string) => {
  const tecnica = TECNICA.toLocaleLowerCase();
  const textTecnica = TecnicaQuir_descripció.toLocaleLowerCase();

  const conditions = tecnica.includes("limitada");

  if (conditions) {
    return false;
  } else {
    return true;
  }
  // if()
};

type TecnicaType =
  | "Hepatectomia dreta"
  | "Hepatectomia esquerra"
  | "Segmentectomia o Bisegmentectomia"
  | "Resecció/ns limitada/es"
  | "Bisegmentectomia 2-3"
  | "Hepatectomia dreta + caudat"
  | "Hepatectomia esquerra + caudat"
  | "Triseccionectomia dreta"
  | "Triseccionectomia esquerra"
  | "Hepatectomia medial"
  | "Hepatectomia major + resecció contralateral"
  | "Radiofreqüència sense resecció"
  | "Hepatectomia menor + resecció contralateral"
  | "Resecció caudat";

const computeBrisbaneLocations = (
  TECNICA: string,
  TecnicaQuir_descripció: string
) => {
  const brisbaneLocationsInIco = {
    hepatectomiaDreta: false,
    hepatectomiaEsquerra: false,
    hepatectomiaAmpliadaDreta: false,
    hepatectomiaAmpliadaEsquerra: false,
    SeccionectomiaAnteriorDreta: false,
    SeccionectomiaPosteriorDreta: false,
    Bisegmentectomia2i3: false,
    Bisegmentectomia6i7: false,
    Bisegmentectomia5i8: false,
    BisegmentectomiaAltra: false,
    Segmentectomia1a8: false,
  };

  const;

  // if(TECNICA)
};

// (async () =>
//   console.log(await estimateCCIInBaseMaxClavienAndTargetCCI("IIIb", 61)))();

type TNMTypes = "cTNM" | "pTNM" | "ypTNM";

export type cancerTypeForTNM = "adenocarcinoma" | "squamousCarcinoma";

type TNMType = {
  cancerType: cancerTypeForTNM;
  isPathologic?: boolean;
  isTreatedBefore?: boolean;
  gradeOfDifferentiation?: pDifferentiationGradeType;
  T: cTtype | pTtype | ypTtype;
  N?: cNtype | pNtype | ypNtype;
  M?: "0" | "1";
};
export const computeStageFromTNM = ({
  cancerType,
  isPathologic = false,
  isTreatedBefore = false,
  gradeOfDifferentiation,
  T,
  N,
  M,
}: TNMType | undefined) => {
  // TODO: make return types with generics
  if (!isPathologic) {
    // is clinical evaluation
    if (N === "1") N = "+";
    if (N === "0") N = "-";
    if (cancerType === "adenocarcinoma") {
      return (
        (cTNMRelationsAdenocarcinoma.find(
          (item) => item.N === N && item.T === T
        )?.result as cTNMType) || undefined
      );
    }
    if (cancerType === "squamousCarcinoma") {
      return (
        (cTNMRelationsSquamousCarcinoma.find(
          (item) => item.N === N && item.T === T
        )?.result as cTNMType) || undefined
      );
    }
  } else {
    // is pathological evaluation
    if (isTreatedBefore) {
      // common for adenocarcinoma and squamousCarcinoma

      return (
        (ypTNMRelations.find(
          (item) => (item.N ? item.N === N : item.M === M) && item.T === T
        )?.result as ypTNMType) || undefined
      );
    }

    if (cancerType === "adenocarcinoma") {
      return (
        (pTNMRelationsAdenocarcinoma.find(
          (item) =>
            (item.N ? item.N === N : item.M === M) &&
            item.T === T &&
            (item.differentiationGrade
              ? item.differentiationGrade === gradeOfDifferentiation
              : true)
        )?.result as pTNMType) || undefined
      );
    }
    if (cancerType === "squamousCarcinoma") {
      return (
        (pTNMRelationsAdenocarcinoma.find(
          (item) =>
            (item.N ? item.N === N : item.M === M) &&
            item.T === T &&
            (item.differentiationGrade
              ? item.differentiationGrade === gradeOfDifferentiation
              : true)
        )?.result as pTNMType) || undefined
      );
    }
  }
};

// console.log(
//   computeStageFromTNM({
//     T: "1b",
//     M: "1",
//     gradeOfDifferentiation: "G1",
//     isPathologic: true,
//     cancerType: "adenocarcinoma",
//   })
// );
// console.log(
//   computeStageFromTNM({
//     T: "1", // should check types depending on what you introduce as generic
//     N: "0",
//     isPathologic: true,
//     isTreatedBefore: true,
//     cancerType: "adenocarcinoma",
//   })
// );
// console.log(
//   computeStageFromTNM({
//     T: "1b",
//     N: "0",
//     gradeOfDifferentiation: "G3",
//     isPathologic: true,
//     cancerType: "adenocarcinoma",
//   })
// );

// estimateCCIInBaseMaxClavienAndTargetCCI("gradeIIIa", 70);

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
