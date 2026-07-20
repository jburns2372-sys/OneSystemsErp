const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 20 workers...');

  const workersToCreate = [
    {
      workerId: 'EMP-001', firstName: 'Juan', lastName: 'Dela Cruz', designation: 'Project Director', 
      workerCategory: 'ADMIN', employmentType: 'REGULAR', rateType: 'MONTHLY_SALARY', basicMonthlySalary: 150000,
      withholdingTaxEnabled: true, sssDeductionEnabled: true, philHealthDeductionEnabled: true, pagibigDeductionEnabled: true,
      tinNumber: '111-222-333', sssNumber: '01-2345678-9',
      gender: 'MALE', civilStatus: 'MARRIED'
    },
    {
      workerId: 'EMP-002', firstName: 'Maria', lastName: 'Clara', designation: 'Project Manager', 
      workerCategory: 'ENGINEER', employmentType: 'PROJECT_BASED', rateType: 'MONTHLY_SALARY', basicMonthlySalary: 90000,
      withholdingTaxEnabled: true, sssDeductionEnabled: true, philHealthDeductionEnabled: true, pagibigDeductionEnabled: true,
      tinNumber: '222-333-444', sssNumber: '02-3456789-0',
      gender: 'FEMALE', civilStatus: 'SINGLE'
    },
    {
      workerId: 'EMP-003', firstName: 'Carlos', lastName: 'Agoncillo', designation: 'Electrical Engineer', 
      workerCategory: 'ENGINEER', employmentType: 'PROJECT_BASED', rateType: 'MONTHLY_SALARY', basicMonthlySalary: 55000,
      withholdingTaxEnabled: true, sssDeductionEnabled: true, philHealthDeductionEnabled: true, pagibigDeductionEnabled: true,
      tinNumber: '333-444-555',
      gender: 'MALE', civilStatus: 'MARRIED'
    },
    {
      workerId: 'EMP-004', firstName: 'Elena', lastName: 'Rizal', designation: 'Mechanical Engineer', 
      workerCategory: 'ENGINEER', employmentType: 'REGULAR', rateType: 'MONTHLY_SALARY', basicMonthlySalary: 52000,
      withholdingTaxEnabled: true, sssDeductionEnabled: true, philHealthDeductionEnabled: true, pagibigDeductionEnabled: true,
      tinNumber: '444-555-666',
      gender: 'FEMALE', civilStatus: 'SINGLE'
    },
    {
      workerId: 'EMP-005', firstName: 'Mario', lastName: 'Mabini', designation: 'Materials Engineer', 
      workerCategory: 'ENGINEER', employmentType: 'PROJECT_BASED', rateType: 'MONTHLY_SALARY', basicMonthlySalary: 48000,
      withholdingTaxEnabled: true, sssDeductionEnabled: true, philHealthDeductionEnabled: true, pagibigDeductionEnabled: true,
      tinNumber: '555-666-777',
      gender: 'MALE', civilStatus: 'SINGLE'
    },
    {
      workerId: 'EMP-006', firstName: 'Sophia', lastName: 'Bonifacio', designation: 'Finance Officer', 
      workerCategory: 'ACCOUNTING', employmentType: 'REGULAR', rateType: 'MONTHLY_SALARY', basicMonthlySalary: 45000,
      withholdingTaxEnabled: true, sssDeductionEnabled: true, philHealthDeductionEnabled: true, pagibigDeductionEnabled: true,
      tinNumber: '666-777-888',
      gender: 'FEMALE', civilStatus: 'MARRIED'
    },
    {
      workerId: 'EMP-007', firstName: 'Luis', lastName: 'Luna', designation: 'Project Accountant', 
      workerCategory: 'ACCOUNTING', employmentType: 'REGULAR', rateType: 'MONTHLY_SALARY', basicMonthlySalary: 40000,
      withholdingTaxEnabled: true, sssDeductionEnabled: true, philHealthDeductionEnabled: true, pagibigDeductionEnabled: true,
      tinNumber: '777-888-999',
      gender: 'MALE', civilStatus: 'SINGLE'
    },
    {
      workerId: 'EMP-008', firstName: 'Antonio', lastName: 'Luna', designation: 'Stockman', 
      workerCategory: 'WAREHOUSE', employmentType: 'DAILY_WORKER', rateType: 'DAILY_RATE', dailyRate: 650,
      withholdingTaxEnabled: false, sssDeductionEnabled: true, philHealthDeductionEnabled: true, pagibigDeductionEnabled: true,
      tinNumber: '888-999-000',
      gender: 'MALE', civilStatus: 'SINGLE'
    },
    {
      workerId: 'EMP-009', firstName: 'Pedro', lastName: 'Penduko', designation: 'Welder', 
      workerCategory: 'SKILLED', employmentType: 'DAILY_WORKER', rateType: 'DAILY_RATE', dailyRate: 850,
      withholdingTaxEnabled: false, sssDeductionEnabled: false, philHealthDeductionEnabled: false, pagibigDeductionEnabled: false,
      gender: 'MALE', civilStatus: 'MARRIED'
    },
    {
      workerId: 'EMP-010', firstName: 'Lito', lastName: 'Lapid', designation: 'Plumber', 
      workerCategory: 'SKILLED', employmentType: 'DAILY_WORKER', rateType: 'DAILY_RATE', dailyRate: 750,
      withholdingTaxEnabled: false, sssDeductionEnabled: true, philHealthDeductionEnabled: true, pagibigDeductionEnabled: true,
      gender: 'MALE', civilStatus: 'MARRIED'
    },
    {
      workerId: 'EMP-011', firstName: 'Ramon', lastName: 'Revilla', designation: 'Electrician', 
      workerCategory: 'SKILLED', employmentType: 'DAILY_WORKER', rateType: 'DAILY_RATE', dailyRate: 800,
      withholdingTaxEnabled: false, sssDeductionEnabled: false, philHealthDeductionEnabled: false, pagibigDeductionEnabled: false,
      gender: 'MALE', civilStatus: 'MARRIED'
    },
    {
      workerId: 'EMP-012', firstName: 'Bong', lastName: 'Revilla', designation: 'Electrician', 
      workerCategory: 'SKILLED', employmentType: 'DAILY_WORKER', rateType: 'DAILY_RATE', dailyRate: 800,
      withholdingTaxEnabled: false, sssDeductionEnabled: true, philHealthDeductionEnabled: true, pagibigDeductionEnabled: true,
      gender: 'MALE', civilStatus: 'SINGLE'
    },
    {
      workerId: 'EMP-013', firstName: 'Coco', lastName: 'Martin', designation: 'Foreman', 
      workerCategory: 'FOREMAN', employmentType: 'PROJECT_BASED', rateType: 'DAILY_RATE', dailyRate: 1200,
      withholdingTaxEnabled: true, sssDeductionEnabled: true, philHealthDeductionEnabled: true, pagibigDeductionEnabled: true,
      tinNumber: '999-000-111',
      gender: 'MALE', civilStatus: 'SINGLE'
    },
    {
      workerId: 'EMP-014', firstName: 'Vic', lastName: 'Sotto', designation: 'Safety Officer', 
      workerCategory: 'SAFETY_OFFICER', employmentType: 'MONTHLY_EMPLOYEE', rateType: 'MONTHLY_SALARY', basicMonthlySalary: 35000,
      withholdingTaxEnabled: true, sssDeductionEnabled: true, philHealthDeductionEnabled: true, pagibigDeductionEnabled: true,
      tinNumber: '000-111-222',
      gender: 'MALE', civilStatus: 'MARRIED'
    },
    {
      workerId: 'EMP-015', firstName: 'Joey', lastName: 'De Leon', designation: 'Heavy Equipment Operator', 
      workerCategory: 'OPERATOR', employmentType: 'DAILY_WORKER', rateType: 'DAILY_RATE', dailyRate: 950,
      withholdingTaxEnabled: false, sssDeductionEnabled: false, philHealthDeductionEnabled: false, pagibigDeductionEnabled: false,
      gender: 'MALE', civilStatus: 'SINGLE'
    },
    {
      workerId: 'EMP-016', firstName: 'Tito', lastName: 'Sotto', designation: 'Driver', 
      workerCategory: 'DRIVER', employmentType: 'DAILY_WORKER', rateType: 'DAILY_RATE', dailyRate: 700,
      withholdingTaxEnabled: false, sssDeductionEnabled: true, philHealthDeductionEnabled: true, pagibigDeductionEnabled: true,
      gender: 'MALE', civilStatus: 'MARRIED'
    },
    {
      workerId: 'EMP-017', firstName: 'Manny', lastName: 'Pacquiao', designation: 'Helper', 
      workerCategory: 'HELPER', employmentType: 'DAILY_WORKER', rateType: 'DAILY_RATE', dailyRate: 500,
      withholdingTaxEnabled: false, sssDeductionEnabled: false, philHealthDeductionEnabled: false, pagibigDeductionEnabled: false,
      gender: 'MALE', civilStatus: 'MARRIED'
    },
    {
      workerId: 'EMP-018', firstName: 'Dingdong', lastName: 'Dantes', designation: 'Helper', 
      workerCategory: 'HELPER', employmentType: 'DAILY_WORKER', rateType: 'DAILY_RATE', dailyRate: 500,
      withholdingTaxEnabled: false, sssDeductionEnabled: false, philHealthDeductionEnabled: false, pagibigDeductionEnabled: false,
      gender: 'MALE', civilStatus: 'SINGLE'
    },
    {
      workerId: 'EMP-019', firstName: 'Piolo', lastName: 'Pascual', designation: 'Structural Consultant', 
      workerCategory: 'CONSULTANT', employmentType: 'FREELANCE_CONSULTANT', rateType: 'PROFESSIONAL_FEE', professionalFee: 150000,
      withholdingTaxEnabled: true, sssDeductionEnabled: false, philHealthDeductionEnabled: false, pagibigDeductionEnabled: false,
      tinNumber: '123-123-123', withholdingTaxType: 'EXPANDED_WITHHOLDING_TAX', withholdingTaxRate: 10,
      gender: 'MALE', civilStatus: 'SINGLE'
    },
    {
      workerId: 'EMP-020', firstName: 'John', lastName: 'Lloyd', designation: 'Painting Subcontractor', 
      workerCategory: 'FREELANCER', employmentType: 'ONE_LOT_WORKER', rateType: 'ONE_LOT', contractAmount: 250000,
      withholdingTaxEnabled: true, sssDeductionEnabled: false, philHealthDeductionEnabled: false, pagibigDeductionEnabled: false,
      tinNumber: '321-321-321', withholdingTaxType: 'EXPANDED_WITHHOLDING_TAX', withholdingTaxRate: 2, retentionPercentage: 10,
      gender: 'MALE', civilStatus: 'SINGLE'
    }
  ];

  for (const w of workersToCreate) {
    await prisma.worker.upsert({
      where: { workerId: w.workerId },
      update: w,
      create: w
    });
  }

  console.log('Successfully seeded 20 comprehensive workers!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
