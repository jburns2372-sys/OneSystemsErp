import AssistantClient from './AssistantClient';

export const dynamic = 'force-dynamic';

export default function AssistantPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', color: '#fff' }}>
      <AssistantClient />
    </div>
  );
}
