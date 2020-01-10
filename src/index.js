#!/usr/bin/env node

const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const chalk = require("chalk");
const yargs = require("yargs");

/**List of questions to be asked to the person who is trying to use this boilerplate
 * Question asked is projectName,bunder identifier,navigation package required
 * if navigation required, ask drawer and tab is required for them
 * then ask icon package is required or not
 * then ask ui theme library is required
 */
const QUESTIONS = [
  {
    name: "name",
    type: "input",
    message: "Project name:",
    when: () => !yargs.argv["name"],
    validate: input => {
      if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
      else
        return "Project name may only include letters, numbers, underscores and hashes.";
    }
  },
  {
    name: "bundle",
    type: "input",
    message: "Bundle Identifier name:",
    when: () => !yargs.argv["bundle"],
    validate: input => {
      if (/^[a-z0-9]+(\.[a-z0-9]+)+$/gi.test(input)) return true;
      else return "Provide a valid bundle Identifier";
    }
  },
  {
    name: "navigation",
    type: "list",
    message: "Would you like to install react-navigation?",
    choices: ["Yes", "No"],
    when: response => !yargs.argv["navigation"]
  },
  {
    name: "drawer",
    type: "list",
    message: "Do you need drawer in react-navigation?",
    choices: ["Yes", "No"],
    when: response => !yargs.argv["drawer"] && response.navigation === "Yes"
  },
  {
    name: "tab",
    type: "list",
    message: "Do you need tab in react-navigation?",
    choices: ["Yes", "No"],
    when: response => !yargs.argv["tab"] && response.navigation === "Yes"
  },
  {
    name: "icon",
    type: "list",
    message: "Do you need react-native-vector-icons?",
    choices: ["Yes", "No"],
    when: () => !yargs.argv["icon"]
  },
  {
    name: "theme",
    type: "list",
    message: "Do you need any UI library?",
    choices: ["Yes", "No"],
    when: () => !yargs.argv["theme"]
  },
  {
    name: "themeList",
    type: "list",
    message: "Pick any one UI library",
    choices: [
      "native-base",
      "react-native-elements",
      "react-native-material-ui",
      "react-native-paper",
      "None of the above required"
    ],
    when: response => !yargs.argv["themeList"] && response.theme === "Yes"
  }
];

const CURR_DIR = process.cwd();

inquirer.prompt(QUESTIONS).then(answers => {
  answers = Object.assign({}, answers, yargs.argv);

  const projectName = answers["name"];
  const bundleIdentifier = answers["bundle"];
  const navigation = answers["navigation"];
  const drawer = answers["drawer"];
  const tab = answers["tab"];
  const icon = answers["icon"];
  const theme = answers["theme"];
  const themeList = answers["themeList"];

  const process = postProcessNode({ projectName, bundleIdentifier });

  if (process) {
    if (navigation === "Yes" || icon === "Yes" || theme === "Yes") {
      addDependecyPackage({
        projectName,
        navigation,
        drawer,
        tab,
        icon,
        theme,
        themeList
      });
    }
    changeBundleIdentifier({ projectName, bundleIdentifier });
  }
});

function postProcessNode(options) {
  let cmd = "";

  if (shell.which("react-native")) {
    cmd = `react-native init ${options.projectName}`;
  } else {
    console.log(chalk.red("React native cli not found"));
    return false;
  }

  if (cmd) {
    const result = shell.exec(cmd);

    if (result.code !== 0) {
      console.log(chalk.red("React native app cannot be created"));
      return false;
    }
    console.log(chalk.red("React native app successfully created"));
    return true;
  }

  return true;
}

function changeBundleIdentifier(options) {
  const tartgetPath = path.join(CURR_DIR, options.projectName);

  shell.cd(tartgetPath);

  let cmd = "";

  if (shell.which("react-native-rename")) {
    cmd = `react-native-rename -b ${options.bundleIdentifier}`;
  } else {
    let packages = "";
    if (shell.which("yarn")) {
      packages = "yarn global add react-native-rename";
    } else if (shell.which("npm")) {
      packages = "npm install react-native-rename -g";
    }
    const yarnNpm = shell.exec(package);
    if (yarnNpm.code !== 0) {
      console.log(
        chalk.red("React native bundle identifier cannot be changed ")
      );
      return false;
    }
    cmd = `react-native-rename "${options.projectName}" -b ${options.bundleIdentifier}`;
  }

  if (cmd) {
    const result = shell.exec(cmd);

    if (result.code !== 0) {
      console.log(
        chalk.red("React native bundle identifier cannot be changed")
      );
      return false;
    }

    console.log(chalk.red("React native bundle identifier changed"));
    return true;
  } else {
    console.log(chalk.red("No package found. Cannot run installation."));
  }

  return true;
}

function addDependecyPackage(options) {
  const tartgetPath = path.join(CURR_DIR, options.projectName);

  shell.cd(tartgetPath);

  let cmd = "";

  if (shell.which("yarn")) {
    cmd = `yarn add ${options.navigation === "Yes" &&
      "react-navigation react-navigation-stack"} ${options.drawer === "Yes" &&
      "react-navigation-drawer"} ${options.tab === "Yes" &&
      "react-navigation-tabs"} ${options.icon === "Yes" &&
      "react-native-vector-icons"} ${options.theme === "Yes" &&
      options.themeList !== "None of the above required" &&
      options.themeList}`;
  } else if (shell.which("npm")) {
    cmd = `npm install --save ${options.navigation === "Yes" &&
      "react-navigation react-navigation-stack"} ${options.drawer === "Yes" &&
      "react-navigation-drawer"} ${options.tab === "Yes" &&
      "react-navigation-tabs"} ${options.icon === "Yes" &&
      "react-native-vector-icons"} ${options.theme === "Yes" &&
      options.themeList !== "None of the above required" &&
      options.themeList}`;
  }
  const dependecy = shell.exec(cmd);
  if (dependecy.code !== 0) {
    console.log(chalk.red("Dependency packages not installed "));
    return false;
  }

  if (cmd) {
    const result = shell.exec(cmd);

    if (result.code !== 0) {
      console.log(chalk.red("Dependency packages not installed "));
      return false;
    }
    shell.exec("react-native link");

    console.log(chalk.red("Dependency packages added"));
    return true;
  } else {
    console.log(chalk.red("No package found. Cannot run installation."));
  }

  return true;
}
