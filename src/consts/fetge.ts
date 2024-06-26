export const NOSINOC = {
  NO: "0",
  SI: "1",
  NOCONSTA: "9",
};

export const NS_NOSI = {
  false: "N",
  true: "S",
};
export type NOSINOCType = typeof NOSINOC;
const ABC = {
  A: "1",
  B: "2",
  C: "3",
  DESCONEGUT: "9",
};

export const basicParseID = (noParsedId: string) => {
  return "#" + noParsedId.replace(":", "\\3A ");
};

let depthIteration = 0;
let currentPath = "";

export const getKeyFromEntryId = (Obj, ID) => {
  let foundValue = "";
  ++depthIteration;

  for (const [key, value] of Object.entries(Obj)) {
    currentPath = currentPath + "." + key;
    if (typeof value === "object") {
      foundValue = getKeyFromEntryId(value, ID);

      if (foundValue) return foundValue;

      depthIteration = 0;
    } else if (typeof value === "string") {
      if (key === "ID" || value.includes("form")) {
        // found ID to check with input

        let parsedObjId = value[0] === "#" ? value : basicParseID(value);
        let parsedInputId = ID[0] === "#" ? ID : basicParseID(ID);

        if (parsedObjId === parsedInputId) {
          if (key === "ID") {
            return currentPath;
          }
          if (value.includes("form")) return key;
        }
        currentPath = "";
      }
    }
  }
  return foundValue;
};

export const HTML_IDS_LIVER = {
  TEXT_FORM_NHC: "form:INPUT_6779_44691_137869",
  TANCAMENT_REGISTRE_DADES: "#form\\3A INPUT2_6779_44691_137978",
  DATA_INGRES: "#form\\3A INPUT_6779_44691_137875",
  DATA_ALTA: "#form\\3A INPUT_6779_44691_137874",
  DATA_DIAGNOSTIC: "#form\\3A INPUT_6779_44691_166797",
  DATA_IQ: "#form\\3A INPUT_6779_44691_137079",
  EDAT_IQ: "#form\\3A INPUT_6779_44691_137870",
  PES_KG: "#form\\3A INPUT_6779_44691_166781",
  TALLA_CM: "#form\\3A INPUT_6779_44691_166782",
  ASA: {
    ID: "#form\\3A INPUT_6779_44691_137903",
    VALUES: { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" },
  },
  ECOG: {
    ID: "#form\\3A INPUT_6779_44691_166784",
    VALUES: {
      "NO-VALORAT": "8",
    },
  },
  ERAS: {
    ID: "#form\\3A INPUT_6779_44691_166785",
    VALUES: {
      // gotta be NO
      NO: "0",
    },
  },
  CMD_ABANS: {
    ID: "#form\\3A INPUT_6779_44691_137391",
    VALUES: NOSINOC,
  },
  TEXT_DATA_CMD_ABANS: "#form\\3A INPUT_6779_44691_166786",
  INFORME_CMD_ABANS: {
    ID: "#form\\3A INPUT_6779_44691_166787",
    VALUES: NOSINOC,
  },
  CMD_DESPRES: {
    ID: "#form\\3A INPUT_6779_44691_137392",
    VALUES: NOSINOC,
  },

  IND_CIRU_HEP: {
    ID: "#form\\3A INPUT_6779_44691_137955",
    VALUES: {
      MH: "1",
    },
  },
  TRACTAMENT_H: {
    ID: "#form\\3A INPUT_6779_44691_336323",
    VALUES: {
      QUIRURGIC_ONLY: "1",
      LOCOREGIONAL_ONLY: "2",
      LOCOREGIONAL_AND_QUIRURGIC: "3",
    },
  },
  LOCOREGIONAL: {
    ID: "form:INPUT_6779_44691_166943",
    VALUES: {
      NO: "0",
      RF: "2",
      mw: "1",
      ALTRES: "4",
      NOCONSTA: "9",
    },
  },
  ACCESS_IQ: {
    ID: "#form\\3A INPUT_6779_44691_137973",
    VALUES: {
      NO: "0",
      OBERTA: "1",
      LAPAROSCOPICA: "2",
      LAPAROSCOPICA_CONV: "3",
      ROBOTICA: "4",
      NOCONSTA: "9",
    },
  },
  CONVERSIO: {
    ID: "#form\\3A INPUT_6779_44691_166798",
    VALUES: NOSINOC,
  },
  CONVERSIO_PLANEJADA: {
    ID: "#form\\3A INPUT_6779_44691_166788",
    VALUES: NOSINOC,
  },
  RADICALITAT_IQ: {
    ID: "#form\\3A INPUT_6779_44691_137904",
    VALUES: {
      R0: "1",
      R1: "2",
      R2: "3",
      NOCONSTA: "9",
    },
  },
  TUMOR_ORIGEN_MH: {
    ID: "#form\\3A INPUT_6779_44691_137911",
    VALUES: {
      CCR: "1",
    },
  },
  NUM_MH_DIAG: "#form\\3A INPUT_6779_44691_166842",
  DIAMETRE_MAJOR_MH: "#form\\3A INPUT_6779_44691_166843",
  NUM_RESECCIONS_H_PREV: "#form\\3A INPUT_6779_44691_137410",
  AFECTACIO_BILOBULAR_MH: {
    ID: "#form\\3A INPUT_6779_44691_137411",
    VALUES: NOSINOC,
  },
  LOC_TUMOR_AL_DX: {
    LOC_SEG_I: {
      ID: "form:INPUT_6779_44691_166971",
      VALUES: NOSINOC,
    },
    LOC_SEG_II: {
      ID: "form:INPUT_6779_44691_166972",
      VALUES: NOSINOC,
    },
    LOC_SEG_III: {
      ID: "form:INPUT_6779_44691_166973",
      VALUES: NOSINOC,
    },
    LOC_SEG_IV: {
      ID: "form:INPUT_6779_44691_166974",
      VALUES: NOSINOC,
    },
    LOC_SEG_V: {
      ID: "form:INPUT_6779_44691_166975",
      VALUES: NOSINOC,
    },
    LOC_SEG_VI: {
      ID: "form:INPUT_6779_44691_166976",
      VALUES: NOSINOC,
    },
    LOC_SEG_VII: {
      ID: "form:INPUT_6779_44691_166977",
      VALUES: NOSINOC,
    },
    LOC_SEG_VIII: {
      ID: "form:INPUT_6779_44691_166978",
      VALUES: NOSINOC,
    },
  },
  IQ_SIMULT_TUMOR_PRIMARI: {
    ID: "form:INPUT_6779_44691_166841",
    VALUES: NOSINOC,
  },
  TIPUS_RESECCIO_MH: {
    ID: "form:INPUT_6779_44691_137412",
    VALUES: {
      MAJOR: "1",
      MAJOR_EXTESA: "2",
      MENOR: "3",
      NO_CONSTA: "9",
    },
  },
  TIPUS_BRISBANE: {
    ID: "form:INPUT_6779_44691_166942",
    VALUES: {
      REGLADA: "1",
      NO_REGLADA: "2",
      NO_CONSTA: "9",
    },
  },
  ALPSS: {
    ID: "form:INPUT_6779_44691_137441",
    VALUES: NOSINOC,
  },
  EMBOLITZACIO_PORTAL_PREOP_MH: {
    ID: "form:INPUT_6779_44691_137399",
    VALUES: NOSINOC,
  },
  RADIOEMBOLITZACIO_MH: {
    ID: "form:INPUT_6779_44691_166907",
    VALUES: NOSINOC,
  },
  LOC_BRISBANE: {
    HEPATECTOMIA_O_HEMIHEPATECTOMIA_DRETA: {
      ID: "form:INPUT_6779_44691_166979",
      VALUES: NS_NOSI,
    },
    HEPATECTOMIA_O_HEMIHEPATECTOMIA_ESQUERRA: {
      ID: "form:INPUT_6779_44691_166980",
      VALUES: NS_NOSI,
    },
    HEPATECTOMIA_AMP_DRETA: {
      ID: "form:INPUT_6779_44691_166981",
      VALUES: NS_NOSI,
    },
    HEPATECTOMIA_AMP_ESQUERRA: {
      ID: "form:INPUT_6779_44691_166982",
      VALUES: NS_NOSI,
    },
    SECCIONECTOMIA_O_SECTORECTOMIA_ANTERIOR_DRETA: {
      ID: "form:INPUT_6779_44691_166983",
      VALUES: NS_NOSI,
    },
    SECCIONECTOTMIA_O_SECTORECTOMIA_POSTERIOR_DRETA: {
      ID: "form:INPUT_6779_44691_166984",
      VALUES: NS_NOSI,
    },
    SECCIONECTOTMIA_MEDIAL_ESQUERRA: {
      ID: "form:INPUT_6779_44691_166985",
      VALUES: NS_NOSI,
    },
    SECCIONECTOTMIA_LATERAL_ESQUERRA: {
      ID: "form:INPUT_6779_44691_166986",
      VALUES: NS_NOSI,
    },
    SECTORECTOMIA_MEDIAL_ESQUERRA: {
      ID: "form:INPUT_6779_44691_166988",
      VALUES: NS_NOSI,
    },
    SECTORECTOMIA_LATERAL_ESQUERRA: {
      ID: "form:INPUT_6779_44691_166989",
      VALUES: NS_NOSI,
    },
    BISEGMENTECTOMIA_2_3: {
      ID: "form:INPUT_6779_44691_166990",
      VALUES: NS_NOSI,
    },
    BISEGMENTECTOMIA_6_7: {
      ID: "form:INPUT_6779_44691_166991",
      VALUES: NS_NOSI,
    },
    BISEGMENTECTOMIA_5_8: {
      ID: "form:INPUT_6779_44691_166992",
      VALUES: NS_NOSI,
    },
    BISEGMENTECTOMIA_ALTRA: {
      ID: "form:INPUT_6779_44691_166993",
      VALUES: NS_NOSI,
    },
    BISEGMENTECTOMIA_1_A_8: {
      ID: "form:INPUT_6779_44691_166994",
      VALUES: NS_NOSI,
    },
  },
  COMPL_POST_IQ_90_DIES: {
    ID: "form:INPUT_6779_44691_166789",
    VALUES: NOSINOC,
  },
  CLAVIEN_DINDO: {
    GRAU_I: "form:INPUT_6779_44691_166790",
    GRAU_II: "form:INPUT_6779_44691_166791",
    GRAU_IIIA: "form:INPUT_6779_44691_166792",
    GRAU_IIIB: "form:INPUT_6779_44691_166793",
    GRAU_IVA: "form:INPUT_6779_44691_166794",
    GRAU_IVB: "form:INPUT_6779_44691_166795",
    GRAU_V: "form:INPUT_6779_44691_166796",
    COMPL_MES_GREU: "form:INPUT_SELECT_6779_44691_137906",
    CCI: "form:INPUT_6779_44691_167212",
  },
  COMPL_ESPECIFIQUES: {
    INSF_HEPATICA: {
      ID: "form:INPUT_6779_44691_137402",
      VALUES: NOSINOC,
    },
    GRAU_INSF_HEP: {
      ID: "form:INPUT_6779_44691_137403",
      VALUES: ABC,
    },
    FISTULA_BILIAR: {
      ID: "form:INPUT_6779_44691_137404",
      VALUES: NOSINOC,
    },
    GRAU_FIST_BIL: {
      ID: "form:INPUT_6779_44691_137405",
      VALUES: ABC,
    },
    DEBIT_DIARI_MAX_FUGA_BIL: "form:INPUT_6779_44691_137406",
    COLECCIO_INTRAABOMINAL_DRENATGE: {
      ID: "form:INPUT_6779_44691_137407",
      VALUES: NOSINOC,
    },
    HEMOPERITONEU_POST_IQ_REINTERVENCIO: {
      ID: "form:INPUT_6779_44691_137408",
      VALUES: NOSINOC,
    },
    ASCITIS: {
      ID: "form:INPUT_6779_44691_166835",
      VALUES: NOSINOC,
    },
  },
  COMPL_UCI_REINT_POST_IQ: {
    ESTADA_UCI_REA: {
      ID: "form:INPUT_6779_44691_166836",
      VALUES: NOSINOC,
    },
    TEMPS_UCI_REA_DIES: "form:INPUT_6779_44691_166837",
    REINT_90_DIES: {
      ID: "form:INPUT_6779_44691_137529",
      VALUES: NOSINOC,
    },
    DATA_REINT_90_DIES: "form:INPUT_6779_44691_166838",
    MOTIU_REINT_90_DIES: {
      ID: "form:INPUT_6779_44691_166839",
      VALUES: {
        PER_COMPLICACIO: "1",
        ALTRES: "2",
        NOCONSTA: "9",
      },
    },
  },
  COMPL_MORBI_MORTALITAT: {
    ID: "form:INPUT_6779_44691_166840",
    VALUES: NOSINOC,
  },
  AP: {
    AFFECT_MARGE_RESSECCIO: {
      ID: "form:INPUT_6779_44691_137400",
      VALUES: NOSINOC,
    },
    DIST_MARGE_RESSECCIO: "form:INPUT_6779_44691_137401",
    NUMERO_MH: "form:INPUT_6779_44691_137414",
    MAJOR_MH: "form:INPUT_6779_44691_137415",
  },
  ESTAT_FINAL_PACIENT: {
    DATA_ULT_CONTROL: "form:INPUT_6779_44691_137974",
    ESTAT_PACIENT: {
      ID: "form:INPUT_6779_44691_137975",
      VALUES: {
        VIU: "1",
        EXITUS: "2",
        PERDUA_SEGUIMENT: "3",
      },
    },
    DATA_EXITUS: "form:INPUT_6779_44691_137976",
    CAUSA_EXITUS: {
      ID: "form:INPUT_6779_44691_137977",
      VALUES: {
        COMPL_POSTOP: "1",
        MALALT_TUMOR_RECIDIVA: "2",
        MALALT_TUMOR_PROGRESSIO: "3",
        ALTRES: "98",
        NOCONSTA: "99",
      },
    },
  },
};
