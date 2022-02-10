type TNMRelation = {
  result: cTNMType;
  T: cTtype;
  N: cNtype;
};

export type cTNMType = "I" | "II" | "IIa" | "IIb" | "III" | "IVa" | "IVb";
export type cTtype = "1" | "2" | "3" | "4a" | "4b";
export type cNtype = "0" | "1" | "2" | "3" | "+" | "-";

export const cTNMRelationsAdenocarcinoma: TNMRelation[] = [
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

export const cTNMRelationsSquamousCarcinoma: TNMRelation[] = [
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
