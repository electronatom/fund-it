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

const validateFacilityForLoan = (facility, parentBank, amount, defaultLikelihood, state) => {
    // check if facility can support the amount
    const validAmount = (facility.amount > amount);
    // check state covenant for facility and bank
    const validFacilityState = !facility.covenants.bannedState || !facility.covenants.bannedState.includes(state);
    const validBankState = !parentBank.covenants.bannedState || !parentBank.covenants.bannedState.includes(state);
    // check max default likelihood covenant for facility and bank
    const validFacilityDefault = !facility.covenants.maxDefaultLikelihood || (facility.covenants.maxDefaultLikelihood >= defaultLikelihood);
    const validBankDefault = !parentBank.covenants.maxDefaultLikelihood || (parentBank.covenants.maxDefaultLikelihood >= defaultLikelihood);
    return validAmount && validFacilityState && validBankState && validFacilityDefault && validBankDefault;
};

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
        // get the parent bank of a facility to check covenants if there are none defined for the facility
        const parentBank = banksMap.get(facility.bankId);
        if (!parentBank) throw new Error(`facility with id ${fId} is missing a parent bank`);
        if (validateFacilityForLoan(facility, parentBank, amount, defaultLikelihood, state)) {
            // calculate yield
            const thisYield = calcYield(amount, interestRate, defaultLikelihood, facility.interestRate);
            // update current best facility id and yield information if the yield for this facility is higher
            if (thisYield > bestFacility.expectedYield) {
                bestFacility.id = fId;
                bestFacility.expectedYield = thisYield;
            }
        }
    });
    // if we are able to fund the loan, return the best facility to fund the loan at; else return null
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

const calcYield = (amount, loanInterestRate, defaultLikelihood, facilityInterestRate) => {
    const result = (1 - defaultLikelihood) * loanInterestRate * amount - defaultLikelihood * amount - facilityInterestRate * amount;
    return result;
}

module.exports.fundLoans = fundLoans;