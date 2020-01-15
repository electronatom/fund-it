# fund-it

A node.js based application that accepts loan, institution, and funding information as input, and outputs a list of funded loans and facility yiels with some relevant data. All input and output is in csv format.

## Installation

This is a private loan funding application project based on [Node.js](https://nodejs.org/en/) and express web application framework.

Before installing, [download and install Node.js](https://nodejs.org/en/download/).
Node.js 7.7 or higher is required.

Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```bash
$ cd <your local project directory>
$ npm install
```

## Features

  * Produce a list of funded loans with corresponding funding facility id
  * Produce a list of facilities and their yields after all loans have been funded

## Docs & Community

  * Coming soon...

## Quick Start

  After installing the app, run the application by using node or nodemon and provide the required input directory and output directory.

  The required input directory must contain the following files:
  * banks.csv
  * covenants.csv
  * facilities.csv
  * loans.csv

  The output directory will be used to store the following output files:
  * assignments.csv
  * yields.csv

  The command must be run in this format, with input and output file directory paths being optionally specified:

```bash
$ node app.js [<input_path>] [<output_path>]
```

  Examples:
  
  This command will take input data from ~/fundingdata/input/ and put the resulting data into ~/fundingdata/output/
    ```bash
    $ node app.js ~/fundingdata/input/ ~/fundingdata/output/
    ```

  This command will take input data from current directory and put the resulting data into the current directory
    ```bash
    $ node app.js
    ```

Some sample data is included in the project's /sampleData/ directory.

To use this sample data, run the command as follows for a small set of data:

```bash
$ node app.js ./sampleData/small/ ./temp/small/
```
The resulting output files can be found in the ./temp/small/ directory.

For a larger set of data, run the following command:

```bash
$ node app.js ./sampleData/large/ ./temp/large/
```
The resulting output files can be found in the ./temp/large/ directory. 

## Tests

## Short-Term Laundry List
* Add input csv validation

## Author

* Application: Natalia Baklitskaya


## License

  [MIT](LICENSE)
