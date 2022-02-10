type cTNMRelation = {
  result: cTNMType;
  T: cTtype;
  N: cNtype;
};

export type cTNMType = "I" | "II" | "IIa" | "IIb" | "III" | "IVa" | "IVb";
export type cTtype = "1" | "2" | "3" | "4a" | "4b";
export type cNtype = "0" | "1" | "2" | "3" | "+" | "-";

export const cTNMRelationsAdenocarcinoma: cTNMRelation[] = [
  {
    result: "I",
    T: "1",
    N: "-",
  },
  {
    result: "IIa",
    T: "1",
    N: "+",
  },
  {
    result: "IIb",
    T: "2",
    N: "-",
  },
  {
    result: "III",
    T: "3",
    N: "-",
  },
  {
    result: "III",
    T: "4a",
    N: "-",
  },
  {
    result: "III",
    T: "2",
    N: "+",
  },
  {
    result: "III",
    T: "3",
    N: "+",
  },
  {
    result: "III",
    T: "4a",
    N: "+",
  },
  {
    result: "IVa",
    T: "4b",
    N: "-",
  },
  {
    result: "IVa",
    T: "4b",
    N: "+",
  },
];

export const cTNMRelationsSquamousCarcinoma: cTNMRelation[] = [
  {
    result: "I",
    T: "1",
    N: "-",
  },
  {
    result: "I",
    T: "1",
    N: "+",
  },
  {
    result: "II",
    T: "2",
    N: "-",
  },
  {
    result: "II",
    T: "2",
    N: "+",
  },
  {
    result: "II",
    T: "3",
    N: "-",
  },
  {
    result: "III",
    T: "3",
    N: "+",
  },
  {
    result: "IVa",
    T: "4a",
    N: "-",
  },
  {
    result: "IVa",
    T: "4a",
    N: "+",
  },
  {
    result: "IVa",
    T: "4b",
    N: "-",
  },
  {
    result: "IVa",
    T: "4b",
    N: "+",
  },
];

type pTNMRelation = {
  result: pTNMType;
  T: pTtype;
  N?: pNtype;
  M?: pMtype;
  differentiationGrade?: pDifferentiationGradeType;
};

export type pTNMType =
  | "Ia"
  | "Ib"
  | "Ic"
  | "IIa"
  | "IIb"
  | "IIIa"
  | "IIIb"
  | "IVa"
  | "IVb";
export type pTtype = "1a" | "1b" | "2" | "3" | "4a" | "4b";
export type pNtype = "0" | "1" | "2" | "3" | "+" | "-";
export type pDifferentiationGradeType = "G1" | "G2" | "G3";
export type pMtype = "0" | "1";

export const pTNMRelationsAdenocarcinoma: pTNMRelation[] = [
  {
    result: "Ia",
    differentiationGrade: "G1",
    T: "1a",
    N: "0",
  },
  {
    result: "Ib",
    differentiationGrade: "G2",
    T: "1a",
    N: "0",
  },
  {
    result: "Ic",
    differentiationGrade: "G3",
    T: "1a",
    N: "0",
  },
  {
    result: "Ib",
    differentiationGrade: "G1",
    T: "1b",
    N: "0",
  },
  {
    result: "Ib",
    differentiationGrade: "G2",
    T: "1b",
    N: "0",
  },
  {
    result: "Ic",
    differentiationGrade: "G3",
    T: "1b",
    N: "0",
  },
  {
    result: "Ic",
    differentiationGrade: "G1",
    T: "2",
    N: "0",
  },
  {
    result: "Ic",
    differentiationGrade: "G2",
    T: "2",
    N: "0",
  },
  {
    result: "IIa",
    differentiationGrade: "G3",
    T: "2",
    N: "0",
  },
  {
    result: "IIb",
    T: "3",
    N: "0",
  },
  {
    result: "IIIb",
    T: "4a",
    N: "0",
  },
  {
    result: "IVa",
    T: "4b",
    N: "0",
  },
  // n1
  {
    result: "IIb",
    T: "1a",
    N: "1",
  },
  {
    result: "IIb",
    T: "1b",
    N: "1",
  },
  {
    result: "IIIa",
    T: "2",
    N: "1",
  },
  {
    result: "IIIb",
    T: "3",
    N: "1",
  },
  {
    result: "IIIb",
    T: "4a",
    N: "1",
  },
  {
    result: "IVa",
    T: "4b",
    N: "1",
  },

  // n2
  {
    result: "IIIa",
    T: "1a",
    N: "2",
  },
  {
    result: "IIIa",
    T: "1b",
    N: "2",
  },
  {
    result: "IIIb",
    T: "2",
    N: "2",
  },
  {
    result: "IIIb",
    T: "3",
    N: "2",
  },
  {
    result: "IVa",
    T: "4a",
    N: "2",
  },
  {
    result: "IVa",
    T: "4b",
    N: "2",
  },

  // n3

  {
    result: "IVa",
    T: "1a",
    N: "3",
  },
  {
    result: "IVa",
    T: "1b",
    N: "3",
  },
  {
    result: "IVa",
    T: "2",
    N: "3",
  },
  {
    result: "IVa",
    T: "3",
    N: "3",
  },
  {
    result: "IVa",
    T: "4a",
    N: "3",
  },
  {
    result: "IVa",
    T: "4b",
    N: "3",
  },

  // M1
  {
    result: "IVb",
    T: "1a",
    M: "1",
  },
  {
    result: "IVb",
    T: "1b",
    M: "1",
  },
  {
    result: "IVb",
    T: "2",
    M: "1",
  },
  {
    result: "IVb",
    T: "3",
    M: "1",
  },
  {
    result: "IVb",
    T: "4a",
    M: "1",
  },
  {
    result: "IVb",
    T: "4b",
    M: "1",
  },
];

export const pTNMRelationsSquamousCarcinoma: pTNMRelation[] = [
  {
    result: "Ia",
    differentiationGrade: "G1",
    T: "1a",
    N: "0",
  },
  {
    result: "Ib",
    differentiationGrade: "G2",
    T: "1a",
    N: "0",
  },
  {
    result: "Ic",
    differentiationGrade: "G3",
    T: "1a",
    N: "0",
  },
  {
    result: "Ib",
    T: "1b",
    N: "0",
  },
  {
    result: "Ib",
    differentiationGrade: "G1",
    T: "2",
    N: "0",
  },
  {
    result: "IIa",
    differentiationGrade: "G2",
    T: "2",
    N: "0",
  },
  {
    result: "IIa",
    differentiationGrade: "G3",
    T: "2",
    N: "0",
  },
  {
    result: "IIa",
    T: "3",
    N: "0",
    differentiationGrade: "G1",
  },
  {
    result: "IIa",
    T: "3",
    N: "0",
    differentiationGrade: "G2",
    // this one might be result IIb, if U/M
  },
  {
    result: "IIa",
    T: "3",
    N: "0",
    differentiationGrade: "G3",
    // this one might be result IIb, if U/M
  },
  {
    result: "IIIb",
    T: "4a",
    N: "0",
  },
  {
    result: "IVa",
    T: "4b",
    N: "0",
  },

  // n1
  {
    result: "IIb",
    T: "1a",
    N: "1",
  },
  {
    result: "IIb",
    T: "1b",
    N: "1",
  },
  {
    result: "IIIa",
    T: "2",
    N: "1",
  },
  {
    result: "IIIb",
    T: "3",
    N: "1",
  },
  {
    result: "IIIb",
    T: "4a",
    N: "1",
  },
  {
    result: "IVa",
    T: "4b",
    N: "1",
  },

  // n2
  {
    result: "IIIa",
    T: "1a",
    N: "2",
  },
  {
    result: "IIIa",
    T: "1b",
    N: "2",
  },
  {
    result: "IIIb",
    T: "2",
    N: "2",
  },
  {
    result: "IIIb",
    T: "3",
    N: "2",
  },
  {
    result: "IVa",
    T: "4a",
    N: "2",
  },
  {
    result: "IVa",
    T: "4b",
    N: "2",
  },

  // n3

  {
    result: "IVa",
    T: "1a",
    N: "3",
  },
  {
    result: "IVa",
    T: "1b",
    N: "3",
  },
  {
    result: "IVa",
    T: "2",
    N: "3",
  },
  {
    result: "IVa",
    T: "3",
    N: "3",
  },
  {
    result: "IVa",
    T: "4a",
    N: "3",
  },
  {
    result: "IVa",
    T: "4b",
    N: "3",
  },

  // M1
  {
    result: "IVb",
    T: "1a",
    M: "1",
  },
  {
    result: "IVb",
    T: "1b",
    M: "1",
  },
  {
    result: "IVb",
    T: "2",
    M: "1",
  },
  {
    result: "IVb",
    T: "3",
    M: "1",
  },
  {
    result: "IVb",
    T: "4a",
    M: "1",
  },
  {
    result: "IVb",
    T: "4b",
    M: "1",
  },
];

type ypTNMRelation = {
  result: ypTNMType;
  T: ypTtype;
  N?: ypNtype;
  M?: ypMtype;
};

export type ypTNMType = "I" | "II" | "IIIa" | "IIIb" | "IVa" | "IVb";
export type ypTtype = "0" | "Tis" | "1" | "2" | "3" | "4a" | "4b";
export type ypNtype = pNtype;
export type ypMtype = pMtype;

export const ypTNMRelations: ypTNMRelation[] = [
  {
    result: "I",
    T: "0",
    N: "0",
  },
  {
    result: "I",
    T: "Tis",
    N: "0",
  },
  {
    result: "I",
    T: "1",
    N: "0",
  },
  {
    result: "I",
    T: "2",
    N: "0",
  },
  {
    result: "II",
    T: "3",
    N: "0",
  },
  {
    result: "IIIb",
    T: "4a",
    N: "0",
  },
  {
    result: "IVa",
    T: "4b",
    N: "0",
  },

  // n1
  {
    result: "IIIa",
    T: "0",
    N: "1",
  },
  {
    result: "IIIa",
    T: "Tis",
    N: "1",
  },
  {
    result: "IIIa",
    T: "1",
    N: "1",
  },
  {
    result: "IIIa",
    T: "2",
    N: "1",
  },
  {
    result: "IIIb",
    T: "3",
    N: "1",
  },
  {
    result: "IVa",
    T: "4a",
    N: "1",
  },
  {
    result: "IVa",
    T: "4b",
    N: "1",
  },

  // n2
  {
    result: "IIIb",
    T: "0",
    N: "2",
  },
  {
    result: "IIIb",
    T: "Tis",
    N: "2",
  },
  {
    result: "IIIb",
    T: "1",
    N: "2",
  },
  {
    result: "IIIb",
    T: "2",
    N: "2",
  },
  {
    result: "IIIb",
    T: "3",
    N: "2",
  },
  {
    result: "IVa",
    T: "4a",
    N: "2",
  },
  {
    result: "IVa",
    T: "4b",
    N: "2",
  },

  // n3

  {
    result: "IVa",
    T: "0",
    N: "3",
  },
  {
    result: "IVa",
    T: "Tis",
    N: "3",
  },
  {
    result: "IVa",
    T: "1",
    N: "3",
  },
  {
    result: "IVa",
    T: "2",
    N: "3",
  },
  {
    result: "IVa",
    T: "3",
    N: "3",
  },
  {
    result: "IVa",
    T: "4a",
    N: "3",
  },
  {
    result: "IVa",
    T: "4b",
    N: "3",
  },

  // M1
  {
    result: "IVb",
    T: "0",
    M: "1",
  },
  {
    result: "IVb",
    T: "Tis",
    M: "1",
  },
  {
    result: "IVb",
    T: "1",
    M: "1",
  },
  {
    result: "IVb",
    T: "2",
    M: "1",
  },
  {
    result: "IVb",
    T: "3",
    M: "1",
  },
  {
    result: "IVb",
    T: "4a",
    M: "1",
  },
  {
    result: "IVb",
    T: "4b",
    M: "1",
  },
];
