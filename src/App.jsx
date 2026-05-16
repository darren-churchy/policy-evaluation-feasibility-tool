import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppState } from './hooks/useAppState.js'
import AppLayout        from './components/layout/AppLayout.jsx'
import LandingPage      from './components/pages/LandingPage.jsx'
import Page1            from './components/pages/PageResearchQuestion.jsx'
import PageCausalReadiness from './components/pages/PageCausalReadiness.jsx'
import PageIdealTrial   from './components/pages/PageIdealTrial.jsx'
import Page4            from './components/pages/PageDesignQuestions.jsx'
import Page5            from './components/pages/PageAdjustment.jsx'
import Page6            from './components/pages/PageDataSources.jsx'
import Page7            from './components/pages/PageStatistical.jsx'
import ResultsPage      from './components/pages/ResultsPage.jsx'

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
        {/* Landing page — no sidebar, full-width */}
        <Route path="/"                  element={<LandingPage />} />

        {/* Assessment sections — sidebar visible */}
        <Route path="/research-question" element={<Page1 {...pageProps} />} />
        <Route path="/causal-readiness"  element={
          <PageCausalReadiness
            {...pageProps}
            gatePassed={gatePassed}
            gateFailures={gateFailures}
          />
        } />
        <Route path="/ideal-trial"       element={
          <PageIdealTrial {...pageProps} gatePassed={gatePassed} />
        } />
        <Route path="/design-questions"  element={
          <Page4 {...pageProps} gatePassed={gatePassed} prospectiveOk={prospectiveOk} />
        } />
        <Route path="/adjustment"        element={
          <Page5 {...pageProps} gatePassed={gatePassed} />
        } />
        <Route path="/data-sources"      element={
          <Page6
            {...pageProps}
            gatePassed={gatePassed}
            dataRows={dataRows}
            addDataRow={addDataRow}
            removeDataRow={removeDataRow}
            updateDataRow={updateDataRow}
          />
        } />
        <Route path="/statistical"       element={
          <Page7 {...pageProps} gatePassed={gatePassed} />
        } />
        <Route path="/results"           element={
          <ResultsPage
            inputs={inputs}
            results={results}
            flaggedNextSteps={flaggedNextSteps}
            topDesign={topDesign}
          />
        } />

        {/* Legacy redirects — preserve old page URLs */}
        <Route path="/page1"   element={<Navigate to="/research-question" replace />} />
        <Route path="/page2"   element={<Navigate to="/causal-readiness"  replace />} />
        <Route path="/page3"   element={<Navigate to="/ideal-trial"       replace />} />
        <Route path="/page4"   element={<Navigate to="/design-questions"  replace />} />
        <Route path="/page5"   element={<Navigate to="/adjustment"        replace />} />
        <Route path="/page6"   element={<Navigate to="/data-sources"      replace />} />
        <Route path="/page7"   element={<Navigate to="/statistical"       replace />} />

        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}
