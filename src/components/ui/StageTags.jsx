// Test and Learn stage tags.
//
// The previous tool implemented stage logic in three places that disagreed. The engine now
// holds the single rule, in spec/stages.yaml — but the two decision trees still carried
// their own per-node tags, so the fix had corrected the data without removing the second
// source of truth.
//
// This resolves it the honest way rather than by deleting one of them, because the two say
// different things. The engine infers a stage from what the user has told us about the
// intervention; a tree node's tag is a guess from where you have walked to. Where the
// engine has an answer it wins and says so. Where readiness is unanswered there is nothing
// to infer from, and the tree's positional hint is shown as a hint.

import { useAnswers } from '../../state/AnswersContext.jsx'
import { stageLabel } from '../../engine/stage.js'
import { TlBadge } from './GovukComponents.jsx'
import { T } from '../../styles/tokens.js'

export default function StageTags({ positional = [], style = {} }) {
  const { result } = useAnswers()
  const inferred = result?.stage?.stages ?? []

  const stages = inferred.length ? inferred.map(stageLabel) : positional
  if (!stages.length) return null

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', ...style }}>
      {stages.map(s => <TlBadge key={s} stage={s} />)}
      <span className="govuk-body-s" style={{ color: T.greyText, margin: 0, fontSize: '12px' }}>
        {inferred.length
          ? 'from your readiness answers'
          : 'typical for this kind of question — answer the readiness questions to establish it'}
      </span>
    </div>
  )
}
