import { resetTransactionData } from './src/app/actions/systemResetActions';
async function test() {
  const result = await resetTransactionData('RESET TRANSACTION DATA ONLY');
  console.log('Result:', result);
}
test();
