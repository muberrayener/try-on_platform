

import {MakeupStyle} from "../types/mirror.types";

export const categoryName:Record<string,string>={
  upper_body:"Üst giyim",
  lower_body:"Alt giyim",
  dress:"Elbise",
  kombin:"Kombin"
};

export const accessoryCategoryName:Record<string,string>={
  earrings:"Küpe",
  necklace:"Kolye",
  bracelet:"Bileklik",
  watch:"Saat",
  ring:"Yüzük",
  bag:"Çanta",
  hat:"Şapka",
  other:"Diğer"
};

export const lipstickShades=[
  {id:"1", name:"Vişne", color:"#8B2635"},
  {id:"2", name:"Klasik Kırmızı", color:"#C81D25"},
  {id:"3", name:"Gül Kurusu", color:"#B83B5E", selected:true},
  {id:"4", name:"Gül Pembesi", color:"#E27B8A"},
  {id:"5", name:"Nude Şeftali", color:"#F4B3A8"},
];

export const makeupStyles:{id:MakeupStyle;name:string}[]=[
  {id:"natural",name:"Doğal"},
  {id:"rose",name:"Rose"},
  {id:"soft-glam",name:"Soft Glam"},
  {id:"night",name:"Gece"}
];

export const defaultFaceSrc="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";
