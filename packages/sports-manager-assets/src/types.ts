export interface SportsManagerSeed {
  background: number;
  body: number;
  accessory: number;
  head: number;
  glasses: number;
}

export interface EncodedImage {
  filename: string;
  data: string;
}

export interface SportsManagerData {
  parts: EncodedImage[];
  background: string;
}
