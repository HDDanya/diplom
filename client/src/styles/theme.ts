import { createTheme } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "gray",
  fontFamily: '"Space Grotesk", "Manrope", sans-serif',
  headings: {
    fontFamily: '"Bebas Neue", "Space Grotesk", sans-serif'
  },
  radius: {
    md: "0.75rem"
  },
  defaultRadius: "md",
  colors: {
    gray: [
      "#f7f7f7",
      "#ececec",
      "#dcdcdc",
      "#c4c4c4",
      "#9f9f9f",
      "#7a7a7a",
      "#5a5a5a",
      "#3f3f3f",
      "#222222",
      "#111111"
    ]
  }
});
