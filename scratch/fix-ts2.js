const fs = require('fs');

let f = 'src/app/page.tsx';
if(fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/roleCode === 'SUPER_ADMIN'/g, "String(roleCode) === 'SUPER_ADMIN'");
  c = c.replace(/roleCode === 'ADMIN'/g, "String(roleCode) === 'ADMIN'");
  fs.writeFileSync(f, c);
}

f = 'src/app/job-orders/create/JobOrderFormClient.tsx';
if(fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/\(prev\) =>/g, '(prev: any) =>');
  c = c.replace(/grandMasterTotal \+/g, '(grandMasterTotal || 0) +');
  c = c.replace(/grandMasterTotal \*/g, '(grandMasterTotal || 0) *');
  fs.writeFileSync(f, c);
}

f = 'src/app/subcontracting/packages/[id]/edit/page.tsx';
if(fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/pkg\.isLocked/g, '(pkg as any).isLocked');
  fs.writeFileSync(f, c);
}

f = 'src/app/subcontracting/packages/[id]/PackageWorkflowControls.tsx';
if(fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/maxRight:/g, 'maxHeight:');
  fs.writeFileSync(f, c);
}

f = 'src/app/subcontracting/progress-hub/report-viewer/page.tsx';
if(fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/\.itemBreakdown/g, '?.itemBreakdown');
  c = c.replace(/progress\?\.itemBreakdown/g, '(progress as any)?.itemBreakdown');
  fs.writeFileSync(f, c);
}

f = 'src/app/users/page.tsx';
if(fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/roleCode: user\.roleCode,/g, 'roleCode: user.roleCode || "",');
  c = c.replace(/description: user\.description,/g, 'description: user.description || "",');
  fs.writeFileSync(f, c);
}

f = 'src/app/procurement/canvassing/[id]/page.tsx';
if(fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/canvass\.mr\./g, 'canvass.mr?.');
  fs.writeFileSync(f, c);
}

f = 'src/app/procurement/canvassing/page.tsx';
if(fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/cf\.mr\./g, 'cf.mr?.');
  fs.writeFileSync(f, c);
}
