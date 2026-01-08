const pdfLib = require('pdf-parse');

console.log('Type:', typeof pdfLib);
console.log('Keys:', Object.keys(pdfLib));

if (typeof pdfLib === 'function') {
    console.log('It is a function');
} else {
    console.log('It is NOT a function');
}

// Check for PDFParse export
if (pdfLib.PDFParse) {
    console.log('Has PDFParse export, type:', typeof pdfLib.PDFParse);
}

// Try invocations
const dummyBuffer = Buffer.from('%PDF-1.4\n...'); // minimal header
const PDFParse = pdfLib.PDFParse;

console.log('Testing PDFParse invocation...');

async function test() {
    try {
        console.log('Attempting function call...');
        const result = await PDFParse(dummyBuffer);
        console.log('Function call SUCCESS:', result);
    } catch (e) {
        console.log('Function call ERROR:', e.message);
    }

    try {
        console.log('Attempting new Class()...');
        const instance = new PDFParse(dummyBuffer);
        console.log('Class instantiation SUCCESS');
        console.log('Instance keys:', Object.keys(instance));
        console.log('Instance property .text:', instance.text);
        console.log('Instance prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
    } catch (e) {
        console.log('Class instantiation ERROR:', e.message);
    }
}

test();
