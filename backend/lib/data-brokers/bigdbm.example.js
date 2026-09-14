// Example usage of the BigDBM API adapter
// This demonstrates how to use the BigDBM service in TaskLinkr

const BigDBMAdapter = require('./bigdbm');

// Initialize the adapter
const bigDBM = new BigDBMAdapter();

async function exampleUsage() {
  try {
    console.log('=== BigDBM Adapter Example Usage ===\n');
    
    // 1. Get account information
    console.log('1. Fetching account information...');
    const accountInfo = await bigDBM.getAccountInfo();
    console.log(`Account Balance: ${accountInfo.balance} ${accountInfo.currency}`);
    console.log(`Account Status: ${accountInfo.accountStatus}`);
    console.log(`Current Tier: ${accountInfo.tier}\n`);
    
    // 2. Get pricing information
    console.log('2. Fetching pricing information...');
    const pricing = await bigDBM.getPricing();
    console.log(`Available Tiers: ${pricing.tiers.map(t => t.name).join(', ')}`);
    console.log(`Pay-as-you-go rate: ${pricing.payAsYouGo.ratePerCredit} ${pricing.currency} per credit\n`);
    
    // 3. Search for contacts with income filtering
    console.log('3. Searching for high-income contacts...');
    const searchResults = await bigDBM.searchContacts({
      query: 'business owner',
      minIncome: 100000, // $100k+ annual income
      maxIncome: 500000, // up to $500k annual income
      limit: 5,
      fields: ['firstName', 'lastName', 'email', 'phoneNumbers', 'pqlScore']
    });
    
    console.log(`Found ${searchResults.total} contacts (showing ${searchResults.contacts.length}):`);
    searchResults.contacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.firstName} ${contact.lastName}`);
      console.log(`   PQL Score: ${contact.pqlScore || 'N/A'}`);
      if (contact.email) console.log(`   Email: ${contact.email}`);
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        console.log(`   Phone: ${contact.phoneNumbers[0].number}`);
      }
      console.log('');
    });
    
    // 4. Example of purchasing credits (commented out for safety)
    /*
    console.log('4. Purchasing additional credits...');
    const purchaseResult = await bigDBM.purchaseCredits({
      amount: 1000, // Purchase 1000 credits
      paymentMethodId: 'pm_card_visa' // Example payment method ID
    });
    
    console.log(`Purchase successful! Transaction ID: ${purchaseResult.transactionId}`);
    console.log(`Credits added: ${purchaseResult.creditsAdded}`);
    console.log(`New balance: ${purchaseResult.newBalance}`);
    */
    
    console.log('=== Example completed ===');
  } catch (error) {
    console.error('Error in BigDBM adapter example:', error.message);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}

module.exports = { exampleUsage };