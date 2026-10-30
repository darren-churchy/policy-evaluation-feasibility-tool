// A guide, rendered from spec/guides.yaml.
//
// One component serves all three. Everything on the page — the title, the purpose, when to
// use it, every field and the inventory table — comes from the specification, so adding a
// guide is a spec change rather than a new component.
//
// Everything written here goes to `notes`, never to `answers`. That is what makes a guide
// a guide: it captures the reasoning a reviewer reads without any of it reaching a verdict.
// The store keeps the two objects apart, the engine is passed only answers, and the spec
// validator refuses a guide field that shares an id with a question.

import { useNavigate, useParams } from 'react-router-dom'
import { useAnswers } from '../../state/AnswersContext.jsx'
import { T } from '../../styles/tokens.js'
import {
  PageHeader, Card, SectionTag, Alert, Button, NavButtons, Label, Hint, TextArea, TextInput,
} from '../ui/GovukComponents.jsx'

function Field({ field, value, onChange }) {
  return (
    <div className="govuk-form-group" style={{ marginBottom: '20px' }}>
      <Label htmlFor={field.id}>{field.label}</Label>
      {field.hint && <Hint>{field.hint}</Hint>}
      <TextArea
        id={field.id}
        value={value ?? ''}
        onChange={onChange}
        rows={field.rows ?? 3}
        placeholder={field.placeholder ?? ''}
      />
    </div>
  )
}

/** The data-source inventory. Rows are notes like everything else here. */
function InventoryTable({ table, rows, onChange }) {
  const blank = Object.fromEntries(table.columns.map(c => [c.id, '']))
  const update = (index, columnId, value) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, [columnId]: value } : row)))

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="govuk-table" style={{ marginBottom: '10px' }}>
          <thead className="govuk-table__head">
            <tr className="govuk-table__row">
              {table.columns.map(c => (
                <th key={c.id} scope="col" className="govuk-table__header">{c.label}</th>
              ))}
              <th scope="col" className="govuk-table__header"><span className="govuk-visually-hidden">Remove</span></th>
            </tr>
          </thead>
          <tbody className="govuk-table__body">
            {rows.map((row, i) => (
              <tr key={i} className="govuk-table__row">
                {table.columns.map(c => (
                  <td key={c.id} className="govuk-table__cell">
                    <TextInput
                      id={`${table.id}-${i}-${c.id}`}
                      value={row[c.id] ?? ''}
                      onChange={v => update(i, c.id, v)}
                    />
                  </td>
                ))}
                <td className="govuk-table__cell">
                  <Button
                    variant="secondary"
                    onClick={() => onChange(rows.filter((_, j) => j !== i))}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr className="govuk-table__row">
                <td className="govuk-table__cell" colSpan={table.columns.length + 1}>
                  <span style={{ color: T.greyText }}>No sources listed yet.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Button variant="secondary" onClick={() => onChange([...rows, blank])}>
        {table.add_label ?? 'Add a row'}
      </Button>
    </div>
  )
}

export default function PageGuide({ guideId }) {
  const navigate = useNavigate()
  const params = useParams()
  const { notes, setNote, spec } = useAnswers()

  const id = guideId ?? params.guideId
  const guide = (spec.guides?.guides ?? []).find(g => g.id === id)

  if (!guide) {
    return (
      <div>
        <PageHeader title="Guide not found" />
        <div className="page-content">
          <Alert type="yellow" title="No such guide">
            There is no guide with the name “{id}”.
          </Alert>
          <NavButtons>
            <Button variant="secondary" onClick={() => navigate('/')}>← Home</Button>
          </NavButtons>
        </div>
      </div>
    )
  }

  const rows = Array.isArray(notes[guide.table?.id]) ? notes[guide.table.id] : []

  return (
    <div>
      <PageHeader title={guide.title} />
      <div className="page-content tool-column">

        <Card>
          <SectionTag>What this is for</SectionTag>
          <p className="govuk-body">{guide.purpose}</p>
          {guide.when && (
            <p className="govuk-body-s" style={{ color: T.greyText, marginBottom: 0 }}>
              <strong>When.</strong> {guide.when}
            </p>
          )}
        </Card>

        <Alert type="blue" title="This does not change the assessment">
          Nothing written here feeds the feasibility verdicts — it is kept with your answers,
          carried into the report you can download, and read by whoever reviews the work. The
          assessment asks separately for the facts it needs.
        </Alert>

        {guide.table && (
          <InventoryTable
            table={guide.table}
            rows={rows}
            onChange={next => setNote(guide.table.id, next)}
          />
        )}

        {(guide.fields ?? []).map(field => (
          <Field
            key={field.id}
            field={field}
            value={notes[field.id]}
            onChange={value => setNote(field.id, value)}
          />
        ))}

        <NavButtons>
          <Button variant="moj" onClick={() => navigate('/ladder')}>Back to the assessment</Button>
          <Button variant="secondary" onClick={() => navigate('/')}>← Home</Button>
        </NavButtons>

        <p className="govuk-body-s" style={{ color: T.greyText, borderTop: `1px solid ${T.greyLine}`, paddingTop: '12px' }}>
          Saved with your answers when you download them from the assessment, and included
          in the report. Nothing is stored on this device unless you save a file.
        </p>
      </div>
    </div>
  )
}
