const fs = require('fs');

const mestre = fs.readFileSync('public/js/mestre.js', 'utf8');
const emits = mestre.match(/socket\.emit\([^)]+\)/g) || [];
console.log('Unique emits in mestre.js:', Array.from(new Set(emits.map(e => e.split(',')[0] + ')'))));
