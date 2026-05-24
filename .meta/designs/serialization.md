---
Status: accepted
Date: 2026-05-24
Accepted: 2026-05-24
Assessment: assessments/serialization.md
---

# Serialization / Deserialization — Desired State

Save and restore sentence state. `serialize()` extracts chip values
from a `SentenceState` into a portable object. `deserialize()` overlays
saved values onto a fresh initialization pass, re-deriving all contingency
and display state in a single traversal.

---

## Serialized Format

The default serialized form is a flat record keyed by chip ID:

```typescript
type SerializedSentence = Record<string, unknown>;

// Example:
{
  cadenceMeasure: 'weekly',
  dayOfWeek: ['mon', 'wed', 'fri'],
  taskName: 'Stand-up prep',
  timeOfDay: '9',
}
```

**What's included:**
- Chip values (`ChipState.value`) for all chips in active clauses
- Optional clause activation flags: `__active: { clauseId: true, ... }`
  for any optional clause that is currently active
- Expression mode flags: `__expressionMode: { chipId: true, ... }` for
  any chip currently in expression mode

**What's excluded** (derived at restore time):
- `displayValue`, `valid`, `dirty` — recomputed from domains
- `present`, `visibleChips` — recomputed from contingency
- `contexts` — rebuilt by context propagation pass

The `__active` and `__expressionMode` keys use double-underscore prefix
to avoid collision with chip IDs (which are user-defined identifiers,
never starting with `__`).

### Inactive optional clause values

Chip values in inactive optional clauses are **not serialized** by
default. Rationale: the user hasn't committed to those values. They
persist in memory during a session (for toggle convenience), but saved
state should reflect intentional configuration.

This means restoring a saved sentence with an optional clause active,
then saving again after deactivating it, drops those values. This is
the correct behavior — "I turned it off" means "don't include it."

## API

### `serialize(definition, state)`

```typescript
function serialize(
  definition: SentenceDefinition,
  state: SentenceState,
): SerializedSentence
```

Standalone utility, not a method on any object. Exported from the
package.

If `definition.serializer` is set, calls it with `state` and returns
the result. Otherwise, applies default serialization.

### `deserialize(definition, data)` → `SentenceStore`

```typescript
function deserialize(
  definition: SentenceDefinition,
  data: SerializedSentence,
): SentenceStore
```

Returns a fully initialized `SentenceStore` — the same type returned
by `initializeSentenceState`. The store is ready to be used by the
provider/reducer.

If `definition.deserializer` is set, calls it first to transform
`data` back into the default `{ chipId: value }` format, then proceeds
with the standard hydration.

### Hydration strategy: overlay during initialization (option c)

`deserialize` calls a new `initializeSentenceState` overload that
accepts initial values:

```typescript
export function initializeSentenceState(
  definition: SentenceDefinition,
  initialValues?: SerializedSentence,
): SentenceStore
```

The initialization loop becomes:

1. Resolve domain for each chip (unchanged)
2. For each chip, use `initialValues[chipId] ?? domain.defaultValue`
   as the starting value
3. If `initialValues.__active` exists, set optional clause `active`
   accordingly (true = active, absent = use default)
4. If `initialValues.__expressionMode` exists, set `chipState.expressionMode`
5. Compute display, validity (unchanged)
6. Run initial context pass (unchanged) — this re-derives contingency
   `present`, `visibleChips`, and `contexts` from the restored values

This is a single-pass initialization with zero reducer dispatches.

### Component integration

```typescript
<Chipper
  sentence={definition}
  initialValues={savedData}
  onChange={(state) => save(serialize(definition, state))}
/>
```

`ChipperProps` and `SentenceProviderProps` gain an optional
`initialValues?: SerializedSentence` prop. The provider passes it to
`initializeSentenceState`.

## Custom Serializers

Consumers who need to reshape the output provide a serializer/
deserializer pair on the sentence definition:

```typescript
const taskSentence = sentence(palette)
  .clause('verb', builder().text('create').chip('taskName'))
  .clause('due', builder().optional().text('due').chip('dueDate'))
  .serializer((state) => ({
    name: state.clauses['verb']?.chips['taskName']?.value,
    due_date: state.clauses['due']?.chips['dueDate']?.value ?? null,
    has_due_date: state.clauses['due']?.active ?? false,
  }))
  .deserializer((data) => ({
    taskName: data.name,
    dueDate: data.due_date ?? '',
    __active: { due: data.has_due_date === true },
  }))
  .build();
```

The deserializer's job is to map the external format back to the
default `{ chipId: value }` format that `initializeSentenceState`
understands.

## SentenceViewModel Example

A view model bridges chipper's serialized format and a consumer's
backing data object. This pattern is useful when the data model doesn't
map 1:1 to chip IDs, or when the consumer has validation/transformation
logic beyond what chipper handles.

```typescript
import { serialize, deserialize } from 'chipper';
import type { SentenceState, SentenceDefinition, SerializedSentence } from 'chipper';

// Hypothetical Praxis data model
interface TaskConfig {
  id: string;
  name: string;
  cadence: 'daily' | 'weekly' | 'monthly' | 'custom';
  cadenceInterval?: number;
  cadenceUnit?: string;
  days?: string[];
  dueDate?: string;
  timeOfDay?: string;
  createdAt: string;
  updatedAt: string;
}

class TaskSentenceViewModel {
  private definition: SentenceDefinition;

  constructor(definition: SentenceDefinition) {
    this.definition = definition;
  }

  /** Convert a Praxis TaskConfig into chipper initial values */
  toChipperValues(task: TaskConfig): SerializedSentence {
    const values: SerializedSentence = {
      taskName: task.name,
      cadenceMeasure: task.cadence === 'custom'
        ? String(task.cadenceInterval ?? 2)
        : task.cadence,
    };

    if (task.cadence === 'custom' && task.cadenceUnit) {
      values.cadenceUnit = task.cadenceUnit;
      values.__expressionMode = { cadenceMeasure: true };
    }

    if (task.days?.length) {
      values.dayOfWeek = task.days;
    }

    const active: Record<string, boolean> = {};
    if (task.timeOfDay) {
      values.timeOfDay = task.timeOfDay;
      active.timeOfDay = true;
    }
    if (task.dueDate) {
      values.dueMeasure = task.dueDate;
      active.dueMeasure = true;
    }
    if (Object.keys(active).length > 0) {
      values.__active = active;
    }

    return values;
  }

  /** Convert chipper state back to a Praxis TaskConfig patch */
  fromChipperState(state: SentenceState, existingTask: Partial<TaskConfig> = {}): TaskConfig {
    const serialized = serialize(this.definition, state);

    const cadenceMeasure = serialized.cadenceMeasure as string;
    const isCustom = !isNaN(Number(cadenceMeasure));

    return {
      id: existingTask.id ?? crypto.randomUUID(),
      name: serialized.taskName as string,
      cadence: isCustom ? 'custom' : cadenceMeasure as TaskConfig['cadence'],
      cadenceInterval: isCustom ? Number(cadenceMeasure) : undefined,
      cadenceUnit: isCustom ? serialized.cadenceUnit as string : undefined,
      days: serialized.dayOfWeek as string[] | undefined,
      dueDate: serialized.dueMeasure as string | undefined,
      timeOfDay: serialized.timeOfDay as string | undefined,
      createdAt: existingTask.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /** Load a task into a chipper sentence */
  loadTask(task: TaskConfig): SentenceStore {
    return deserialize(this.definition, this.toChipperValues(task));
  }
}

// Usage:
const vm = new TaskSentenceViewModel(demoSentence);

// Restore from saved task
const store = vm.loadTask(existingTask);
// Pass to <Chipper initialValues={vm.toChipperValues(existingTask)} />

// Save on change
const onSave = (state: SentenceState) => {
  const taskPatch = vm.fromChipperState(state, existingTask);
  api.updateTask(taskPatch);
};
```

The view model is **not part of chipper** — it's a consumer-side pattern.
Chipper provides `serialize` and `deserialize`; the consumer provides
the mapping between their data model and chip values.

## File Locations

| File | Change |
|------|--------|
| `src/core/initialize.ts` | Add `initialValues` parameter to `initializeSentenceState` |
| `src/core/serialize.ts` | New file: `serialize()`, `deserialize()`, `SerializedSentence` type |
| `src/hooks/SentenceProvider.tsx` | Add `initialValues` prop, pass to initializer |
| `src/components/Chipper.tsx` | Add `initialValues` prop, forward to provider |
| `src/index.ts` | Export `serialize`, `deserialize`, `SerializedSentence` |
| `headless.ts` | Export same |

## Tradeoffs

**Overlay during init vs replay through reducer**

Replay (dispatching SET_CHIP_VALUE for each saved chip) would re-use
existing action handlers and guarantee consistency. But it fires N
reducer calls, each cascading through contingency and context
propagation — O(N × clauses) work. Overlay during init does it in a
single pass with a single context propagation at the end.

Revisit if: the overlay approach produces subtle state inconsistencies
that the reducer handlers would have caught (e.g., mode-switching
sentinel logic). If so, add a `validateRestoredState` pass after init.

**Include inactive clause values vs exclude**

Excluding keeps the serialized form intentional (only what the user
committed to). Including would preserve "draft" state across sessions.

Chosen: exclude. Users expect "I turned it off" to mean "it's not saved."
If a consumer wants to preserve draft state, they can write a custom
serializer that includes inactive values.

Revisit if: users report losing work when accidentally toggling a clause
off before saving.

**`__active` / `__expressionMode` meta-keys vs separate arguments**

Alternative: `deserialize(definition, values, { active, expressionMode })`
as separate arguments. Cleaner types but splits the serialized form
across multiple objects, making storage/transport harder.

Chosen: single object with reserved keys. Simpler to store, transmit,
and round-trip. The `__` prefix convention is clear enough.

## Resolved Questions

1. **Round-trip for multi-select values**: Consumer concern. JSON
   handles arrays natively; flattening for form data is not chipper's job.

2. **Reference domain display cache**: Leave for `useReferenceDisplay`
   hook (roadmap item). Note added to roadmap entry.

## Out of Scope

- Versioning / migration of serialized data (consumer concern)
- Server-side serialization (chipper is client-only)
- Undo/redo history (separate feature, different state management)
- `useReferenceDisplay` hook (roadmap item, tangential)
