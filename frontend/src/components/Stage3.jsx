import ReactMarkdown from 'react-markdown';
import './Stage3.css';

export default function Stage3({ finalResponse }) {
  if (!finalResponse) {
    return null;
  }

  const modelId = finalResponse.model || 'Chairman';
  const shortName = modelId.split('/')[1] || modelId;

  // Backward-compatible with old field name; new backend might use `content`
  const text =
    finalResponse.response ??
    finalResponse.content ??
    '';

  return (
    <div className="stage stage3">
      <h3 className="stage-title">Stage 3: Final Council Answer</h3>
      <div className="final-response">
        <div className="chairman-label">
          Chairman: {shortName}
        </div>
        <div className="final-text markdown-content">
          <ReactMarkdown>{text || '*No content returned.*'}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
