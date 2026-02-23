const fs = require('fs');
const p = 'c:/Users/SohaibAli/Documents/PresenterByPotomac/app/src/components/TemplateEditor.tsx';
fs.writeFileSync(p, "// placeholder\nexport default function TemplateEditor(){return null;}\n");
console.log('done');
