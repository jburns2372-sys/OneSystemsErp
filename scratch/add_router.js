const fs = require('fs');
const file = 'c:/Users/user/Documents/JD SOFTWARE PROJECTS/PGH-PMS/src/components/AccomplishmentDataGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import
if (!content.includes('useRouter')) {
  content = content.replace(
    /import React, { useState, useEffect } from "react";/,
    'import React, { useState, useEffect } from "react";\nimport { useRouter } from "next/navigation";'
  );
}

// Add router hook
if (!content.includes('const router = useRouter();')) {
  content = content.replace(
    /const \[isLoading, setIsLoading\] = useState/,
    'const router = useRouter();\n  const [isLoading, setIsLoading] = useState'
  );
}

// Add router.push and window.location logic
content = content.replace(
  /if \(onClose\) \{\n\s*onClose\(\); \/\/ Close the modal to show the new file in the dashboard\n\s*\}/g,
  'if (onClose) {\n          onClose();\n        } else {\n          router.push("/accomplishments");\n          router.refresh();\n        }'
);

fs.writeFileSync(file, content);
console.log('Successfully added router redirect.');
