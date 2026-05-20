const fs = require('fs');
const path = require('path');

// Target file
const OUTPUT_FILE = path.join(__dirname, '../src/data/fdic-banks.json');

// FDIC Endpoint for institutions: ACTIVE:1 and ASSET >= $500M ($500,000 in $000s)
const API_URL = "https://api.fdic.gov/banks/institutions?filters=ACTIVE:1%20AND%20ASSET:%5B500000%20TO%20*%5D&fields=NAME,CERT,STALP,ASSET,DEP,REP_DATE&limit=2000&format=json";

async function fetchFdicBanks() {
  console.log("Fetching FDIC banks above $500M assets...");
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch from FDIC API: ${res.statusText}`);
    }
    const data = await res.json();
    console.log(`Successfully fetched ${data.data.length} banks from FDIC.`);

    const mappedBanks = data.data.map(item => {
      const b = item.data;
      // FDIC reports ASSET and DEP in thousands ($000s). Scale to real dollars.
      const assets = b.ASSET * 1000;
      const totalDeposits = b.DEP * 1000;

      // Industry averages for retail banks:
      // 1. Customers: estimated at 1 customer per $22,000 in assets
      const members = Math.max(1000, Math.floor(assets / 22000));

      // 2. Loans Outstanding: standard Loan-to-Deposit Ratio (LDR) of ~80%
      const loansOutstanding = Math.floor(totalDeposits * 0.82);

      // 3. Trailing 12-Month Originations: typically ~35% of outstanding loans are originated/refinanced per year
      const annualOriginationsTotal = Math.floor(loansOutstanding * 0.35);

      // 4. Originations Mix (Banks have higher mortgage & commercial ratios than CUs):
      const firstMortgageEst = Math.floor(annualOriginationsTotal * 0.38);
      const helocEst = Math.floor(annualOriginationsTotal * 0.08);
      const autoEst = Math.floor(annualOriginationsTotal * 0.16);
      const creditCardEst = Math.floor(annualOriginationsTotal * 0.06);
      const unsecuredEst = Math.floor(annualOriginationsTotal * 0.04);
      const commercialEst = Math.floor(annualOriginationsTotal * 0.28); // Higher commercial focus!

      // 5. Balances Mix:
      const firstLienRE = Math.floor(loansOutstanding * 0.40);
      const juniorLienRE = Math.floor(loansOutstanding * 0.10);
      const auto = Math.floor(loansOutstanding * 0.15);
      const creditCard = Math.floor(loansOutstanding * 0.05);
      const unsecured = Math.floor(loansOutstanding * 0.05);
      const commercial = Math.floor(loansOutstanding * 0.25);

      // 6. Deposits/Shares Mix:
      const drafts = Math.floor(totalDeposits * 0.24); // Checking
      const regular = Math.floor(totalDeposits * 0.32); // Savings
      const mma = Math.floor(totalDeposits * 0.22); // Money Market
      const cds = Math.floor(totalDeposits * 0.16); // CDs
      const ira = Math.floor(totalDeposits * 0.06); // IRAs

      return {
        cu: String(b.CERT), // Re-use 'cu' as the ID field to match our unified schema
        name: b.NAME,
        state: b.STALP,
        peerGroup: 6, // Hardcode standard peer group
        cuType: "bank", // Denotes bank type
        assets,
        members,
        loansOutstanding,
        originations: {
          total: annualOriginationsTotal,
          indirect: 0,
          firstMortgageEst,
          helocEst,
          autoEst,
          creditCardEst,
          unsecuredEst,
          commercialEst
        },
        balances: {
          auto,
          creditCard,
          unsecured,
          firstLienRE,
          juniorLienRE,
          commercial
        },
        shares: {
          regular,
          drafts,
          mma,
          cds,
          ira,
          total: totalDeposits
        }
      };
    });

    // Sort by asset size descending
    mappedBanks.sort((a, b) => b.assets - a.assets);

    const finalPayload = {
      meta: {
        sourceQuarter: data.meta.index.name || "q1-2026",
        minAssets: 500000000,
        bankCount: mappedBanks.length,
        generatedAt: new Date().toISOString()
      },
      banks: mappedBanks
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalPayload, null, 2));
    console.log(`Successfully generated bank database at: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Error fetching FDIC data:", error);
    process.exit(1);
  }
}

fetchFdicBanks();
