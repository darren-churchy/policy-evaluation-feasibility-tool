// Routes.
//
// The seven numbered sections, the scored results page and the Design Finder are gone.
// What replaced each:
//
//   sections 1          -> the landing page and the project guide
//   sections 2, 4, 7    -> the assessment, which asks from spec/questions.yaml
//   sections 3, 5, 6    -> the ideal trial, causal diagram and data source guides
//   results             -> the assessment, and the report you can download from it
//   Design Finder       -> the screening checkpoint at the top of the assessment
//
// Their old paths redirect rather than 404, because they have been linked to.

import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import LandingPage from './components/pages/LandingPage.jsx'
import PageAssessment from './components/pages/PageAssessment.jsx'
import PageGuide from './components/guides/PageGuide.jsx'
import PageQuestionType from './components/pages/tools/PageQuestionType.jsx'

/** Paths the previous tool used, and where each now goes. */
const RETIRED = {
  '/research-question': '/',
  '/causal-readiness': '/assessment',
  '/design-questions': '/assessment',
  '/statistical': '/assessment',
  '/results': '/assessment',
  '/ideal-trial': '/guide/ideal_trial',
  '/adjustment': '/guide/causal_diagram',
  '/data-sources': '/guide/data_sources',
  '/design-finder': '/assessment',
  '/ladder': '/assessment',
  '/quant-tree': '/question-type',
  '/qual-tree': '/question-type',
  '/question-framework': '/question-type',
  '/page1': '/',
  '/page2': '/assessment',
  '/page3': '/guide/ideal_trial',
  '/page4': '/assessment',
  '/page5': '/guide/causal_diagram',
  '/page6': '/guide/data_sources',
  '/page7': '/assessment',
}

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/assessment" element={<PageAssessment />} />
        <Route path="/question-type" element={<PageQuestionType />} />
        <Route path="/guide/:guideId" element={<PageGuide />} />

        {Object.entries(RETIRED).map(([from, to]) => (
          <Route key={from} path={from} element={<Navigate to={to} replace />} />
        ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}
