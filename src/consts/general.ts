export const GENERAL_CONSTS = {
  PORTAL_LOGIN: "https://salut.gencat.cat/pls/gsa/gsapk030.portal",
  INTERFACE_IDS: {
    FILTER_PAGE: {
      TEXT_INPUT_FILTER_BY_LIVER: "#\\36 779_7525_518882",
      BUTTON_EXECUTE_FILTER: "#form\\3A executeFilterButton",
      TEXT_INPUT_NHC: "#form\\3A variable_MC0_44691_8_6779_44691_137869",
      TEXT_INPUT_FROM_DATE: "#form\\3A variable_MC0_44689_1_6779_44689_133999",
      TEXT_INPUT_TO_DATE: "#form\\3A variableFi_MC0_44689_1_6779_44689_133999",
    },

    LIST_PAGE: {
      TEXT_RESULTS_COUNT: "#form\\3A resultsTable\\3A _titleBar",
      LINK_LIST_ITEM: (index: number) =>
        `#form\\3A resultsTable\\3A tableRowGroup1\\3A 0\\3A tc${index}\\3A var_${index}`,
      BUTTON_BACK_LIST: "#form\\3A backButton",
    },

    FORM_PAGE: {
      BUTTON_BACK_FORM: "#form\\3A back",
    },
  },
};
