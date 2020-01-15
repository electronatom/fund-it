const csv = require("csvtojson");
const fs = require('fs');

// Export funded loans data as specified csv files in the provided output directory
const exportFundingOutputToCSV = (fundedLoans, outputDir) => {
    let assignments = 'loan_id,facility_id';
    let yields = 'facility_id,expected_yield';
    const assignmentsCSVPath = outputDir.concat('assignments.csv');
    const yieldsCSVPath = outputDir.concat('yields.csv');
    if (!fundedLoans.length) {
        return new Error('there are no funded loans to export');
    }
    let facilitiesYieldMap = new Map();
    fundedLoans.forEach((loan) => {
        facilitiesYieldMap.set(loan.facilityId, (facilitiesYieldMap.get(loan.facilityId) || 0) + loan.expectedYield);
        assignments = assignments.concat(`\n${loan.loanId},${loan.facilityId}`);
    });
    facilitiesYieldMap.forEach((totalYield, id) => {
        yields = yields.concat(`\n${id},${Math.round(totalYield)}`);
    });
    fs.writeFile(assignmentsCSVPath, assignments, (err) => {
        if(err) return err;
    });
    fs.writeFile(yieldsCSVPath, yields, (err) => {
        if(err) return err;
    });
}

// Read and parse facility and loan data from the required csv files in the provided input directory
const processInput = async (inputDir) => {
    // TODO: Add a funciton to verify that the files exist
    const banksJSON = await csv().fromFile(inputDir.concat('banks.csv'));
    const covenantsJSON = await csv().fromFile(inputDir.concat('covenants.csv'));
    const facilitiesJSON = await csv().fromFile(inputDir.concat('facilities.csv'));
    const loansJSON = await csv().fromFile(inputDir.concat('loans.csv'));
    const banksMap = createBanksMap(banksJSON);
    const facilitiesMap = createFacilitiesMap(facilitiesJSON);
    mapCovenants(covenantsJSON, banksMap, facilitiesMap);
    return {
        banksMap,
        facilitiesMap,
        loansJSON
    }
}

const createBanksMap = (banksJSON) => {
    let banksMap = new Map();
    banksJSON.forEach((b) => {
        let bank = {
            name: b.name,
            covenants: {}
        }
        banksMap.set(b.id, bank);
    });
    return banksMap;
}

const createFacilitiesMap = (facilitiesJSON) => {
    let facilitiesMap = new Map();
    facilitiesJSON.forEach((f) => {
        let facility = {
            amount: parseInt(f.amount),
            interestRate: parseFloat(f.interest_rate),
            bankId: f.bank_id,
            covenants: {}
        }
        facilitiesMap.set(f.id, facility);
    });
    return facilitiesMap;
}

const mapCovenants = async (covenantsJSON, banksMap, facilitiesMap) => {
    covenantsJSON.forEach((c) => {
        if (!c.facility_id && c.bank_id && (banksMap.has(c.bank_id))) {
            let bankData = banksMap.get(c.bank_id);
            if (c.max_default_likelihood) {
                bankData.covenants['maxDefaultLikelihood'] = parseFloat(c.max_default_likelihood);
            }
            if (c.banned_state) {
                bankData.covenants['bannedState'] = c.banned_state;
            }
            banksMap.set(c.bank_id, bankData);
        } else if (facilitiesMap.has(c.facility_id)) {
            let facilityData = facilitiesMap.get(c.facility_id);
            if (c.max_default_likelihood) {
                facilityData.covenants['maxDefaultLikelihood']  = parseFloat(c.max_default_likelihood);
            }
            if (c.banned_state) {
                facilityData.covenants['bannedState'] = facilityData.covenants['bannedState'] ? facilityData.covenants['bannedState'].concat(c.banned_state) : [c.banned_state];
            }
            facilitiesMap.set(c.facility_id, facilityData);
        }
    });
}

module.exports.processInput = processInput;
module.exports.exportFundingOutputToCSV = exportFundingOutputToCSV;