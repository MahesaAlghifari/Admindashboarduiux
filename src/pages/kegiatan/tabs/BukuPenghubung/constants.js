export const DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat"
];

export const METRICS = [
  {
    key: "jam_tidur",
    label: "Jam Tidur",
    type: "text",
    placeholder: "21.00 - 05.00",
    unit: ""
  },
  {
    key: "anak_bab",
    label: "Anak BAB ?",
    type: "select",
    options: ["Tidak", "Ya"]
  },
  {
    key: "suhu_tubuh",
    label: "Suhu Tubuh",
    type: "number",
    placeholder: "36",
    unit: "°C",
    min: 30,
    max: 45
  },
  {
    key: "menu_sarapan",
    label: "Menu Sarapan",
    type: "text",
    placeholder: "Nasi Goreng"
  }
];