import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, SectionTag, Alert, NavButtons, Button,
  RadioQuestion, LockedPage,
} from '../ui/GovukComponents.jsx'

const emptyRow = () => ({ name: '', type: '', period: '', geo: '', quality: '', linkable: '', hasExposure: '', hasOutcome: '' })

export default function Page6({ inputs, set, gatePassed }) {
  const navigate = useNavigate()
  const [rows, setRows] = useState([emptyRow()])

  if (!gatePassed) return <><div style={{ background: '#fff', borderBottom: '4px solid #9c1b6d', padding: '20px 30px' }}><h1 className="govuk-heading-l" style={{ margin: 0 }}>Data Sources</h1></div><div style={{ padding: '30px' }}><LockedPage /></div></>

  const updateRow = (i, field, val) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }
  const addRow    = () => setRows(prev => [...prev, emptyRow()])
  const removeRow = () => setRows(prev => prev.length > 1 ? prev.slice(0, -1) : prev)

  const thStyle = { background: '#0b0c0c', color: '#fff', padding: '8px 10px', textAlign: 'left', fontSize: '14px', whiteSpace: 'nowrap' }
  const tdStyle = { padding: '4px 6px', verticalAlign: 'top' }

  const sel = (val, onChange, options) => (
    <select className="govuk-select" style={{ width: '100%', fontSize: '14px', padding: '4px' }}
      value={val} onChange={e => onChange(e.target.value)}>
      <option value="">—</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
  const inp = (val, onChange, placeholder = '') => (
    <input className="govuk-input" style={{ width: '100%', fontSize: '14px', padding: '4px' }}
      type="text" value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  )

  return (
    <div>
      <div style={{ background: '#fff', borderBottom: '4px solid #9c1b6d', padding: '20px 30px' }}>
        <h1 className="govuk-heading-l" style={{ margin: 0 }}>Data Sources</h1>
      </div>
      <div style={{ padding: '30px' }}>
        <Alert type="blue" title="About this section">
          Compile an inventory of the data sources you plan to use in your evaluation.
          Your responses will be used to assess whether sufficient data exist to support
          your preferred evaluation design and to identify data gaps that may affect feasibility.
        </Alert>

        <Card>
          <SectionTag>Data Source Inventory</SectionTag>
          <p className="govuk-hint">
            Add a row for each data source — including administrative data, surveys, and
            linkage datasets. Be as specific as possible about coverage and quality.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr>
                  {['Data source','Type','Coverage period','Geography','Quality','Linkable?','Has exposure?','Has outcome?'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8f8f8' }}>
                    <td style={tdStyle}>{inp(row.name,    v => updateRow(i,'name',v),    'e.g. Police National Computer')}</td>
                    <td style={tdStyle}>{inp(row.type,    v => updateRow(i,'type',v),    'e.g. Administrative')}</td>
                    <td style={tdStyle}>{inp(row.period,  v => updateRow(i,'period',v),  'e.g. 2010–present')}</td>
                    <td style={tdStyle}>{inp(row.geo,     v => updateRow(i,'geo',v),     'e.g. England & Wales')}</td>
                    <td style={tdStyle}>{sel(row.quality, v => updateRow(i,'quality',v), ['Good','Moderate','Poor'])}</td>
                    <td style={tdStyle}>{sel(row.linkable,v => updateRow(i,'linkable',v),['Yes','No','Possible'])}</td>
                    <td style={tdStyle}>{sel(row.hasExposure,v => updateRow(i,'hasExposure',v),['Yes','No'])}</td>
                    <td style={tdStyle}>{sel(row.hasOutcome, v => updateRow(i,'hasOutcome', v),['Yes','No'])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button className="govuk-button govuk-button--secondary" style={{ marginBottom: 0 }} onClick={addRow}>＋ Add row</button>
            <button className="govuk-button govuk-button--secondary" style={{ marginBottom: 0 }} onClick={removeRow}>− Remove row</button>
          </div>
        </Card>

        <Card>
          <SectionTag>Data Quality &amp; Linkage</SectionTag>
          <RadioQuestion id="p6_linkage"
            label="Can data sources containing your exposure and outcome be linked at the individual level?"
            hint="Consider whether a unique identifier is available in both systems (e.g. NINO, CRN, NHS number) and whether data sharing agreements are in place or achievable. IG approvals can take 6–18 months — initiate conversations early."
            value={inputs.p6_linkage} onChange={v => set('p6_linkage', v)}
            options={[
              { value: 'yes',   label: 'Yes — linkage is established' },
              { value: 'maybe', label: 'Possible — not yet done but feasible' },
              { value: 'no',    label: 'No — linkage not possible' },
            ]} />
          <RadioQuestion id="p6_missing"
            label="What is the expected level of missing data in your primary outcome variable?"
            hint="Missing outcome data can introduce bias if missingness is related to treatment or other study variables (missing not at random)."
            value={inputs.p6_missing} onChange={v => set('p6_missing', v)}
            options={[
              { value: 'low',      label: 'Low — less than 5% missing' },
              { value: 'moderate', label: 'Moderate — 5–20% missing' },
              { value: 'high',     label: 'High — more than 20% missing' },
              { value: 'unknown',  label: 'Unknown at this stage' },
            ]} />
          <div className="govuk-form-group">
            <label className="govuk-label govuk-label--s" htmlFor="p6_gaps">
              Describe any known data gaps or quality concerns
            </label>
            <div className="govuk-hint">
              Include completeness, accuracy, timeliness, and consistency issues. Also note
              any data access or governance barriers that may affect feasibility.
            </div>
            <textarea className="govuk-textarea" id="p6_gaps" rows={4}
              value={inputs.p6_gaps ?? ''} onChange={e => set('p6_gaps', e.target.value)} />
          </div>
        </Card>

        <NavButtons>
          <Button variant="secondary" onClick={() => navigate('/page5')}>← Previous: Adjustment &amp; DAG</Button>
          <Button onClick={() => navigate('/page7')}>Next: Statistical Feasibility →</Button>
        </NavButtons>
      </div>
    </div>
  )
}
