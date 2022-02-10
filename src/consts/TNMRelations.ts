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
  N: pNtype;
  differentiationGrade: differentiationGradeType;
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
export type differentiationGradeType = "G1" | "G2" | "G3";

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
    differentiationGrade: "G1" || "G2",
    T: "1b",
    N: "0",
  },
  {
    result: "Ic",
    differentiationGrade: "G3",
    T: "1b",
    N: "0",
  },

  // left on COLUMN N0 T1b
  // {
  //   result: "Ib",
  //   differentiationGrade: "G1" || "G2",
  //   T: "1b",
  //   N: "0",
  // },
  // {
  //   result: "Ic",
  //   differentiationGrade: "G3",
  //   T: "1b",
  //   N: "0",
  // },
];
