/**Import statements, these are the one which is used to setup the boilerplate*/
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

//Get Current directory
const CURR_DIR = process.cwd();

/**
 * This is the first function which executes, which will get input from users.
 * Getting project name,bundle identifier,drawer,icon and theme answers
 * After getting the answer, need to start the process of creating the boilerplate
 */
inquirer.prompt(QUESTIONS).then(answers => {
  //assigning the object answer
  answers = Object.assign({}, answers, yargs.argv);

  //get all answers
  const projectName = answers["name"];
  const bundleIdentifier = answers["bundle"];
  const navigation = answers["navigation"];
  const drawer = answers["drawer"];
  const tab = answers["tab"];
  const icon = answers["icon"];
  const theme = answers["theme"];
  const themeList = answers["themeList"];

  /**
   * Start the process of creating a react native project using given project name.
   */
  const nativeApp = createNativeApp(projectName);

  /**
   * After process finished, need to check if there any dependency need to be installed
   * This condition is checked based on user performance
   */
  if (nativeApp) {
    /**
     * Need to check, wheather need to execute depedency
     */
    if (navigation === "Yes" || icon === "Yes" || theme === "Yes") {
      /**
       * This function is called here to add the dependency of this project
       * Passing all values get from user as object to this function
       */
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
    /**
     * After the process of adding dependency, change the bundle identifier as given.
     * Pass the project name and bundle identifier to this function
     */
    changeBundleIdentifier({ projectName, bundleIdentifier });
  }
});

/**
 * This function is used to create the native app using the projectName given from the user.
 * This function will execute the react native cli to create the project.
 * @param {project name from the user} projectName
 */
function createNativeApp(projectName) {
  //initialize the commant object to execute
  let cmd = "";

  /**
   * check the system contains react native
   * if it contains, set the init command, else return the error to the user to install the react-native-cli
   */
  if (shell.which("react-native")) {
    cmd = `react-native init ${projectName}`;
  } else {
    console.log(
      chalk.red(
        "React native cli not found. Please install react-native-cli. Refer documentation"
      )
    );
    return false;
  }

  /**
   * if command is set, need to execute the command using shell
   * check the status of executed code and return it to the user.
   */
  if (cmd) {
    //execuate the command using shell
    const result = shell.exec(cmd);

    //check resultant of executed command
    if (result.code !== 0) {
      console.log(chalk.red("React native app cannot be created"));
      return false;
    }
    console.log(chalk.red("React native app successfully created"));
    return true;
  }
  return true;
}

/**
 * This function is used to change the bundle identifier.
 * @param {projectName and bundleIdentier} options
 */
function changeBundleIdentifier(options) {
  //set the target path
  const tartgetPath = path.join(CURR_DIR, options.projectName);

  //move to target path using shell command
  shell.cd(tartgetPath);

  //initialize the command variable
  let cmd = "";

  /**
   * check the react-native-rename package is installed globally in user system.
   * If not, install it using yarn and change the bundle identifier
   */
  if (shell.which("react-native-rename")) {
    //set the command to change bundle identifier
    cmd = `react-native-rename -b ${options.bundleIdentifier}`;
  } else {
    //set package check variable to install react-native-rename package
    let packages = "";
    /**
     * check yarn is available in system.
     */
    if (shell.which("yarn")) {
      packages = "yarn global add react-native-rename";
    } else if (shell.which("npm")) {
      packages = "npm install react-native-rename -g";
    }

    /**
     * execute the package
     */
    const yarnNpm = shell.exec(packages);

    /**
     * check the resultant
     */
    if (yarnNpm.code !== 0) {
      console.log(
        chalk.red("React native bundle identifier cannot be changed ")
      );
      return false;
    }
    /**
     * change the bundle identifier after the rename package installed.
     */
    cmd = `react-native-rename "${options.projectName}" -b ${options.bundleIdentifier}`;
  }

  /**
   * execute the command
   */
  if (cmd) {
    const result = shell.exec(cmd);

    /**
     * check the resultant of executed code
     */
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

/**
 * This function is used to add the dependency given from user input
 * Package is added based on user input
 * @param {projectName,navigation,drawer,tab,icon,theme,themeList} options
 */
function addDependecyPackage(options) {
  //set the target path
  const tartgetPath = path.join(CURR_DIR, options.projectName);

  //set the targetpath
  shell.cd(tartgetPath);

  //set the command
  let cmd = "";

  /**
   * check the system contains yarn
   * if not install with npm, else add the packages using yarn
   */
  if (shell.which("yarn")) {
    /**
     * this is for yarn
     * create a command for adding the pacakges
     * check with user given parameter and add them in package list
     */
    cmd = `yarn add ${options.navigation === "Yes" &&
      "react-navigation react-navigation-stack"} ${options.drawer === "Yes" &&
      "react-navigation-drawer"} ${options.tab === "Yes" &&
      "react-navigation-tabs"} ${options.icon === "Yes" &&
      "react-native-vector-icons"} ${options.theme === "Yes" &&
      options.themeList !== "None of the above required" &&
      options.themeList}`;
  } else if (shell.which("npm")) {
    /**
     * this is for npm
     * create a command for adding the pacakges
     * check with user given parameter and add them in package list
     */
    cmd = `npm install --save ${options.navigation === "Yes" &&
      "react-navigation react-navigation-stack"} ${options.drawer === "Yes" &&
      "react-navigation-drawer"} ${options.tab === "Yes" &&
      "react-navigation-tabs"} ${options.icon === "Yes" &&
      "react-native-vector-icons"} ${options.theme === "Yes" &&
      options.themeList !== "None of the above required" &&
      options.themeList}`;
  }
  /**
   * Execute the shell command
   */
  const dependecy = shell.exec(cmd);
  /**
   * Check the resultant of dependency added
   */
  if (dependecy.code !== 0) {
    console.log(chalk.red("Dependency packages not installed "));
    return false;
  }

  /**
   * Execute the linking dependency
   * This need to be done,otherwise app will not be installed while running
   */
  shell.exec("react-native link");

  return true;
}
