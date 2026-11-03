import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mentorApi } from '../MentorRoot.jsx';
import { Card, Notice } from '../../components/ui.jsx';

export default function Remarks() {
  const [searchParams] = useSearchParams();
  const [mentees, setMentees] = useState([]);
  const [menteeId, setMenteeId] = useState('');
  const [history, setHistory] = useState([]);

  const [useTranscript, setUseTranscript] = useState(true);
  const [useQa, setUseQa] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [cells, setCells] = useState([{ question: '', answer: '' }]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    mentorApi('/mentor/mentees').then((list) => {
      setMentees(list);
      const preselect = searchParams.get('mentee');
      if (preselect && list.some((m) => m.id === preselect)) setMenteeId(preselect);
      else if (list.length) setMenteeId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!menteeId) return;
    resetDraft();
    loadHistory();
  }, [menteeId]);

  async function loadHistory() {
    const list = await mentorApi(`/mentor/remarks-history/${menteeId}`);
    setHistory(list);
  }

  function resetDraft() {
    clearInterval(timerRef.current);
    setRecording(false);
    setSeconds(0);
    setTranscript('');
    setCells([{ question: '', answer: '' }]);
    setUseTranscript(true);
    setUseQa(true);
    setNote(null);
  }

  function toggleRecording() {
    if (!recording) {
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setRecording(false);
    }
  }
  useEffect(() => () => clearInterval(timerRef.current), []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  function updateCell(i, key, value) {
    const next = cells.slice();
    next[i] = { ...next[i], [key]: value };
    setCells(next);
  }
  function addCell() {
    setCells([...cells, { question: '', answer: '' }]);
  }
  function removeCell(i) {
    setCells(cells.filter((_, idx) => idx !== i));
  }

  async function submit() {
    const cleanCells = useQa ? cells.filter((c) => c.question.trim() || c.answer.trim()) : [];
    const cleanTranscript = useTranscript ? transcript.trim() : '';
    const mode = cleanTranscript && cleanCells.length ? 'both' : cleanTranscript ? 'transcript' : cleanCells.length ? 'qa' : null;
    if (!mode) {
      setNote({ tone: 'red', text: 'Add a transcript, at least one question/answer, or both before submitting.' });
      return;
    }
    try {
      await mentorApi(`/mentor/remarks-history/${menteeId}`, {
        method: 'POST',
        body: JSON.stringify({ mode, transcript: cleanTranscript, cells: cleanCells })
      });
      setNote({ tone: 'green', text: "Remarks submitted and saved to this mentee's record for the semester." });
      resetDraft();
      loadHistory();
    } catch (e) {
      setNote({ tone: 'red', text: e.message });
    }
  }

  return (
    <div>
      <div className="page-title">Remarks</div>
      <div className="page-sub">Log session notes for each mentee — use a transcript, question/answer cells, or both. Every submission is kept for the whole semester.</div>

      <Card>
        <div className="field">
          <label className="label">Mentee</label>
          <select className="input" value={menteeId} onChange={(e) => setMenteeId(e.target.value)}>
            {mentees.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card title="New remark">
        <div style={{ display: 'flex', gap: 18, marginBottom: 16 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={useTranscript} onChange={(e) => setUseTranscript(e.target.checked)} /> Use transcript
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={useQa} onChange={(e) => setUseQa(e.target.checked)} /> Use question / answer cells
          </label>
        </div>

        {useTranscript && (
          <div style={{ marginBottom: 20 }}>
            <div className="card-title" style={{ fontSize: 13 }}>Conversation recording &amp; transcription</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
              <button className="btn btn-red" onClick={toggleRecording}>{recording ? 'Stop recording' : 'Start recording'}</button>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{mm}:{ss}</span>
            </div>
            <textarea className="input" rows={4} placeholder="Transcript will appear here — you can also type/edit directly." value={transcript} onChange={(e) => setTranscript(e.target.value)} />
            <button className="btn btn-xs" style={{ marginTop: 8 }} onClick={() => setTranscript('')}>Clear transcript</button>
          </div>
        )}

        {useQa && (
          <div>
            <div className="card-title" style={{ fontSize: 13 }}>Question / answer cells</div>
            {cells.map((c, i) => (
              <div className="card" style={{ marginBottom: 10 }} key={i}>
                <div className="field">
                  <label className="label">Question {i + 1}</label>
                  <input className="input" value={c.question} onChange={(e) => updateCell(i, 'question', e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Answer / observation</label>
                  <textarea className="input" rows={2} value={c.answer} onChange={(e) => updateCell(i, 'answer', e.target.value)} />
                </div>
                {cells.length > 1 && (
                  <button className="btn btn-xs btn-red" style={{ marginTop: 8 }} onClick={() => removeCell(i)}>Remove cell</button>
                )}
              </div>
            ))}
            <button className="btn btn-xs" onClick={addCell}>Add question cell</button>
          </div>
        )}

        <hr className="div" />
        <button className="btn btn-accent" onClick={submit}>Submit remarks</button>
        {note && <div style={{ marginTop: 10 }}><Notice tone={note.tone}>{note.text}</Notice></div>}
      </Card>

      <Card title="Remarks history for this mentee">
        {history.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>No remarks submitted yet.</div>}
        {history.map((h) => (
          <div className="card" key={h.id} style={{ marginBottom: 10 }}>
            <div className="row" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{h.date}</span>
              <span className="badge b-blue" style={{ textTransform: 'capitalize' }}>{h.mode}</span>
            </div>
            {h.transcript && (
              <div style={{ marginBottom: h.cells.length ? 10 : 0 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Transcript</div>
                <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: '#c3cbdb' }}>{h.transcript}</div>
              </div>
            )}
            {h.cells.length > 0 && (
              <div>
                {h.cells.map((c, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Q: {c.question}</div>
                    <div style={{ fontSize: 13 }}>{c.answer}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
