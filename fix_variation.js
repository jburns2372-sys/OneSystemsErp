const fs = require('fs');
let f = 'src/app/variation-orders/create/page.tsx';
let c = fs.readFileSync(f, 'utf8');

const variationTypeStr = `          <div className={styles.formGroup}>
            <label>Variation Type</label>
            <select 
              className={styles.input}
              value={formData.variationType}
              onChange={e => setFormData({...formData, variationType: e.target.value})}
            >
              <option>Change Order</option>
              <option>Extra Work Order</option>
              <option>Additive Variation</option>
              <option>Deductive Variation</option>
              <option>Reclassification</option>
              <option>Emergency Variation</option>
            </select>
          </div>
`;

const reasonForVariationStr = `          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Reason for Variation</label>
            <input 
              required
              className={styles.input} 
              placeholder="Brief reason (e.g., Design change per RFI-021)"
              value={formData.reasonForVariation}
              onChange={e => setFormData({...formData, reasonForVariation: e.target.value})}
            />
          </div>
`;

// Use regex to handle CRLF or LF safely
c = c.replace(
  /<div className=\{styles\.formGroup\}>\s*<label>Source of Variation<\/label>/,
  variationTypeStr + '\n          <div className={styles.formGroup}>\n            <label>Source of Variation</label>'
);

c = c.replace(
  /<div className=\{styles\.formGroup\} style=\{\{ gridColumn: '1 \/ -1' \}\}>\s*<label>Detailed Description<\/label>/,
  reasonForVariationStr + '\n          <div className={styles.formGroup} style={{ gridColumn: \'1 / -1\' }}>\n            <label>Detailed Description</label>'
);

fs.writeFileSync(f, c);
console.log('Successfully injected missing form fields using regex.');
