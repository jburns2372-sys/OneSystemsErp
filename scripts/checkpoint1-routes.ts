async function check() {
  const r1 = await fetch('http://localhost:3000/api/projects/cmrjo4msn0000vc9c7s65o3lt/scheduling/baseline', { method: 'POST' });
  const b1 = await r1.json();
  console.log("Legacy Baseline:", r1.status, b1);

  const r2 = await fetch('http://localhost:3000/api/projects/cmrjo4msn0000vc9c7s65o3lt/scheduling/lock-baseline', { method: 'POST' });
  const b2 = await r2.json();
  console.log("Legacy Lock:", r2.status, b2);
}

check().catch(console.error);
