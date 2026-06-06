const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../app/payroll/page.tsx'), 'utf8');
const lines = content.split('\n');

let braceCount = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Simple check for braces
  let lineBraces = 0;
  for (let c of line) {
    if (c === '{') {
      braceCount++;
      lineBraces++;
    } else if (c === '}') {
      braceCount--;
      lineBraces--;
    }
  }
  
  if (braceCount < 0) {
    console.log(`CRITICAL: Braces went negative at line ${i + 1}: ${line}`);
    break;
  }
  
  if (i + 1 === 603) {
    console.log(`At line 603 (return statement): braceCount = ${braceCount}`);
  }
}
console.log("Brace check completed.");
