import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        about: resolve(__dirname, "about.html"),
        contacts: resolve(__dirname, "contacts.html"),
        cases: resolve(__dirname, "cases.html"),
        admin: resolve(__dirname, "admin.html"),
        servicesCitizens: resolve(__dirname, "services-citizens.html"),
        servicesBusiness: resolve(__dirname, "services-business.html"),
        serviceRealEstate: resolve(__dirname, "service-real-estate.html"),
        serviceConstruction: resolve(__dirname, "service-construction.html")
      }
    }
  }
});
