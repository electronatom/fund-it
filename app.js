const csv=require("csvtojson");

var myArgs = process.argv.slice(2);

// Get input and output directories from command line arguments
const inputDir = myArgs[0] || './';
const outputDir = myArgs[1] || './';

const processInput = async (inputDir) => {
    const banksJSON = await csv().fromFile(inputDir.concat('banks.csv'));
    const covenantsJSON = await csv().fromFile(inputDir.concat('covenants.csv'));
    const facilitiesJSON = await csv().fromFile(inputDir.concat('facilities.csv'));
    const loansJSON = await csv().fromFile(inputDir.concat('loans.csv'));
    const banksMap = createBanksMap(banksJSON);
    const facilitiesMap = createFacilitiesMap(facilitiesJSON);
    mapCovenants(covenantsJSON, banksMap, facilitiesMap);
    const fundedLoans = fundLoans(loansJSON, facilitiesMap, banksMap);
    console.log(fundedLoans);
}

const fundLoans = (loansJSON, facilitiesMap, banksMap) => {
    let fundedLoans = [];
    loansJSON.forEach((loan) => {
        const result = fundLoan(loan, facilitiesMap, banksMap);
        if (result) {
            fundedLoans.push(result);
        }
    });
    return fundedLoans;
}

const fundLoan = (loan, facilitiesMap, banksMap) => {
    const amount = parseInt(loan.amount);
    const interestRate = parseFloat(loan.interest_rate);
    const defaultLikelihood = parseFloat(loan.default_likelihood);
    const { state } = loan;
    let bestFacility = {
        id: 0,
        expectedYield: -1
    };
    facilitiesMap.forEach((facility, fId) => {
        const parentBank = banksMap.get(facility.bankId);

        // TODO: Pull out validation into a separate function
        // check if facility can support the amount
        const validAmount = (facility.amount > amount);
        // check state covenant for facility and bank
        const validFacilityState = !facility.covenants.bannedState || !facility.covenants.bannedState.includes(state);
        const validBankState = !parentBank.covenants.bannedState || !parentBank.covenants.bannedState.includes(state);
        // check max default likelihood covenant for facility and bank
        const validFacilityDefault = !facility.covenants.maxDefaultLikelihood || (facility.covenants.maxDefaultLikelihood >= defaultLikelihood);
        const validBankDefault = !parentBank.covenants.maxDefaultLikelihood || (parentBank.covenants.maxDefaultLikelihood >= defaultLikelihood);

        if (validAmount && validFacilityState && validBankState && validFacilityDefault && validBankDefault) {
            // calculate yield
            const thisYield = calcYield(amount, interestRate, defaultLikelihood, facility.interestRate);
            // update current bestfacility id and yield information if this yield is higher
            if (thisYield > bestFacility.expectedYield) {
                bestFacility.id = fId;
                bestFacility.expectedYield = thisYield;
            }
        }
    });
    // if we are able to fund the loan, return the result; else return null
    if (bestFacility.expectedYield >= 0) {
        const result = {
            loanId: loan.id,
            facilityId: bestFacility.id,
            expectedYield: bestFacility.expectedYield,
        };
        return result;
    } else {
        return null;
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

const calcYield = (amount, loanInterestRate, defaultLikelihood, facilityInterestRate) => {
    const result = (1 - defaultLikelihood) * loanInterestRate * amount - defaultLikelihood * amount - facilityInterestRate * amount;
    return result;
}

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

parseInput(inputDir);