import DatabaseToolsClient from './DatabaseToolsClient';

export const dynamic = 'force-dynamic';

export default async function DatabaseToolsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <DatabaseToolsClient />
    </div>
  );
}
