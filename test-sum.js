const fs=require('fs');
const items = JSON.parse(fs.readFileSync('items.json', 'utf8'));

let g=0, m=0, e=0;
let mRegex = /AIR CONDITIONING|ACCU-|EXHAUST|VRV|FCU|REFRIGERANT|DUCT|INSULATION|CONDENSATE|VALVE|PIPE|TESTING & COMMISSIONING|TESTING & COMMISIONING|CONSUMABLES|CHIPPING & RESTORATION \(ROUGH-ONLY\)|CHIPPING & RESTORATION WORKS \(ROUGH ONLY\)|CONCRETE PAD|VIBRATION ISOLATOR|ANGLE BAR|RUGBY|WHITE TAPE|THREADED ROD|NUTS AND WASHER|GRIP ANCHOR|PAINT|LOOP HANGERS|FREON|NITROGEN|MAPP GAS|SILVER ROD|PUMP LIFT|WYE|TEE|ELBOW|CLEANOUT|REFNET|PVC CLADDING|COPPER|3\/4'' THICK|CONTROLLER|STANDARD PANEL|LIQUID-TIGHT|METALLIC FLEXIBLE CONDUIT|COMMUNICATION WIRE|HANGERS & SUPPORTS|1\/4"|3\/8"|1\/2"|5\/8"|3\/4"|7\/8"|1-1\/8"|1-3\/8"|1-5\/8"/i;
let gRegex = /MOBILIZATION|PROJECT MANAGEMENT|ADMIN SUPPORT|QUALITY MANAGEMENT|ENGINEERING MANAGEMENT|WAREHOUSE|SITE OFFICE|PERSONAL PROTECTIVE|TEMPORARY TOOLS|BARRACKS|SAFETY OFFICER|SECURITY GUARDS|MANPOWER SERVICE|SHOPDRAWINGS|TRANSPORTATION|I GENERAL REQUIREMENTS|PERMITS|^MISCELLANEOUS$/i;
let eRegex = /WIRE|CABLE|PANEL|BREAKER|CONDUIT|LIGHT|OUTLET|SWITCH|DATA|CCTV|FIRE ALARM|FDAS|GROUND|TRAY|BOX|THHN|IMC|DP-MAIN|PP-SYSTEM|PP-OUTDOOR|TRANSFORMER|ECB|ROUGH-IN|ROUGHING-IN|MISCELLENEUOS|PULLBOX/i;

let unclassified = [];

eRegex = /WIRE|CABLE|PANEL|BREAKER|CONDUIT|LIGHT|OUTLET|SWITCH|DATA|CCTV|FIRE ALARM|FDAS|GROUND|TRAY|BOX|THHN|IMC|DP-MAIN|PP-SYSTEM|PP-OUTDOOR|TRANSFORMER|ECB|ROUGH-IN|ROUGHING-IN|MISCELLENEUOS|PULLBOX|HANGERS & SUPPORTS/i;
let eItems = [];
items.forEach(i => {
  if (i.d.match(eRegex)) eItems.push(i);
});
let eSum = 0;
eItems.forEach(i => eSum += Math.round(i.c*100));
console.log('E Total:', eSum/100);

let target = 38563613; // 385,636.13 in cents
let dp = new Uint8Array(target + 1);
dp[0] = 1;
let parent = new Int32Array(target + 1).fill(-1);

for(let i=0; i<eItems.length; i++) {
  let val = Math.round(eItems[i].c*100);
  for(let j=target; j>=val; j--) {
    if(dp[j-val] === 1 && dp[j] === 0) {
      dp[j] = 1;
      parent[j] = i;
    }
  }
}
if (dp[target] === 1) {
  console.log('FOUND MATCH FOR 385,636.13!');
  let curr = target;
  let ids = [];
  while(curr > 0) {
    let idx = parent[curr];
    console.log(eItems[idx].id, eItems[idx].d, eItems[idx].c);
    ids.push(eItems[idx].id);
    curr -= Math.round(eItems[idx].c*100);
  }
  console.log('IDS:', JSON.stringify(ids));
} else {
  console.log('NO MATCH FOUND!');
}

console.log('G:', g/100, 'Target:', 2700549.00);
console.log('M:', m/100, 'Target:', 23674716.57);
console.log('E:', e/100, 'Target:', 16731409.32);
console.log('Unclassified:', unclassified);
