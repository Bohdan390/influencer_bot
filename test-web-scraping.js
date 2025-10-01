const apifyService = require('./src/services/apify');

async function testWebScraping() {
    console.log('=' .repeat(60));

    try {
        // Test the extractEmailFromExternalUrl method
        const emails = await apifyService.extractEmailFromExternalUrl('https://lasersmedaesthetics.com/');
        
        console.log('\n📧 EMAIL EXTRACTION RESULTS:');
        console.log('=' .repeat(40));
        
        if (emails && emails.length > 0) {
            console.log(`✅ Found ${emails.length} email(s):`);
            emails.forEach((email, index) => {
                console.log(`   ${index + 1}. ${email}`);
            });
        } else {
            console.log('❌ No emails found');
        }

    } catch (error) {
        console.error('❌ Error during web scraping test:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testWebScraping().then(() => {
    console.log('\n🏁 Web scraping test completed!');
    process.exit(0);
}).catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
