process.env.EDGE_BIN =
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const path = require("path");
const { single } = require("rxjs");
module.exports = function (config) {
  config.set({
    basePath: "",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    plugins: [
      require("karma-jasmine"),
      require("@chiragrupani/karma-chromium-edge-launcher"),
      require("karma-jasmine-html-reporter"),
      require("karma-coverage"),
      require("karma-junit-reporter"),
      require("@angular-devkit/build-angular/plugins/karma"),
    ],
    client: {
      jasmine: {},
      clearContext: false,
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: require("path").join(__dirname, "../../coverage/lib-zurich"),
      subdir: ".",
      reporters: [
        { type: "html" },
        { type: "text-summary" },
        { type: "lcovonly", file: "lcov.info" },
      ],
      check: {
        global: {
          statements: 80,
          branches: 70,
          functions: 80,
          lines: 80,
        },
      },
    },

    junitReporter: {
      outputDir: path.join(__dirname, "../../reports/junit"),
      outputFile: "unit-test-results.xml",
      useBrowserName: false,
      // TIP opcional para SonarQube genérico con karma-junit-reporter “moderno”:
      // xmlVersion: 1  // genera el XML en formato Sonar (si tu versión lo soporta)
    },
    logLevel: config.LOG_DEBUG,
    reporters: ["progress", "kjhtml", "coverage", "junit"],
    browsers: ["Edge"],
    restartOnFileChange: true,
    singleRun: true,
  });
};
