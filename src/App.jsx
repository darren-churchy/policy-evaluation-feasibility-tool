import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppState } from './hooks/useAppState.js'
import AppLayout    from './components/layout/AppLayout.jsx'
import Page1        from './components/pages/Page1.jsx'
import Page2        from './components/pages/Page2.jsx'
import Page3        from './components/pages/Page3.jsx'
import Page4        from './components/pages/Page4.jsx'
import Page5        from './components/pages/Page5.jsx'
import Page6        from './components/pages/Page6.jsx'
import Page7        from './components/pages/Page7.jsx'
import ResultsPage  from './components/pages/ResultsPage.jsx'

export default function App() {
  const {
    inputs, set,
    dataRows, addDataRow, removeDataRow, updateDataRow,
    gatePassed, gateFailures,
    prospectiveOk,
    results, flaggedNextSteps, topDesign,
    completedSections,
  } = useAppState()

  const pageProps = { inputs, set }

  return (
    <AppLayout gatePassed={gatePassed} completedSections={completedSections}>
      <Routes>
        <Route path="/"        element={<Navigate to="/page1" replace />} />
        <Route path="/page1"   element={<Page1 {...pageProps} />} />
        <Route path="/page2"   element={<Page2 {...pageProps} />} />
        <Route path="/page3"   element={
          <Page3 {...pageProps} gatePassed={gatePassed} gateFailures={gateFailures} />
        } />
        <Route path="/page4"   element={
          <Page4 {...pageProps} gatePassed={gatePassed} prospectiveOk={prospectiveOk} />
        } />
        <Route path="/page5"   element={<Page5 {...pageProps} gatePassed={gatePassed} />} />
        <Route path="/page6"   element={
          <Page6
            {...pageProps}
            gatePassed={gatePassed}
            dataRows={dataRows}
            addDataRow={addDataRow}
            removeDataRow={removeDataRow}
            updateDataRow={updateDataRow}
          />
        } />
        <Route path="/page7"   element={<Page7 {...pageProps} gatePassed={gatePassed} />} />
        <Route path="/results" element={
          <ResultsPage
            inputs={inputs}
            results={results}
            flaggedNextSteps={flaggedNextSteps}
            topDesign={topDesign}
          />
        } />
        <Route path="*" element={<Navigate to="/page1" replace />} />
      </Routes>
    </AppLayout>
  )
}
