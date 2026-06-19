import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./index.css";
import App from "./App.tsx";

const theme = createTheme({
  defaultRadius: "md",
  fontFamily: "var(--sans)",
  headings: {
    fontFamily: "var(--heading)",
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="auto" theme={theme}>
      <DatesProvider settings={{ consistentWeeks: true, firstDayOfWeek: 1 }}>
        <App />
      </DatesProvider>
    </MantineProvider>
  </StrictMode>,
);
