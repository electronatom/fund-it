const { processInput, exportFundingOutputToCSV } = require('./utils/ioUtils.js');
const { fundLoans } = require('./utils/fundingUtils.js');

var myArgs = process.argv.slice(2);

// Get input and output directories from command line arguments
const inputDir = myArgs[0] || './';
const outputDir = myArgs[1] || './';

// Main function to run the applicaiton
const runApp = async (inputDir, outputDir) => {
    try {
        // Process input from CSV and put into a standardized map format for easy lookup
        console.info(`processing input from csv files located in ${inputDir} ...`);
        const { facilitiesMap, banksMap, loansJSON } = await processInput(inputDir);
        console.info('DONE processing input ✔');
        // Fund loans based on the selected algorithm
        console.info(`attempting to fund ${loansJSON.length} loans ...`);
        const fundedLoans = fundLoans(loansJSON, facilitiesMap, banksMap);
        console.info(`DONE funding loans: ${fundedLoans.length} out of ${loansJSON.length}  ✔`);
        // Export output to CSV in the expected format
        console.info(`exporting funded loans data to ${outputDir} ...`);
        exportFundingOutputToCSV(fundedLoans, outputDir);
        console.info('DONE exporting funded loan data   ✔');
    } catch (e) {
        console.error(e);
    }
}

runApp(inputDir, outputDir);

/*
interface Loan = {
    interestRate: number;
    amount: number;
    id: number;
    defaultLikelihood: number;
    state: string[];
}
interface Covenant = {
    facilityId: number;
    maxDefaultLikelihood: number;
    bankId: number;
    bannedState: string;
}
interface Facility = {
    amount: number;
    interestRate: number;
    id: number;
    bankId: number;
}
interface Bank = {
    id: number;
    name: string;
}
 */
