import { Chipper, sentence, clause } from 'chipper';

const demoSentence = sentence()
  .clause(
    'greeting',
    clause().required().lead('Every').chip('interval', 'cadence'),
  )
  .clause(
    'action',
    clause()
      .required()
      .lead('create a task named')
      .chip('taskName', 'freeText'),
  )
  .build();

export function App() {
  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Chipper Demo</h1>
      <p>Plain-English editing interfaces for complex configuration.</p>
      <hr />
      <Chipper sentence={demoSentence} />
    </div>
  );
}
