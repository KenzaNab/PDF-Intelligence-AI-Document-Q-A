import React, { useState, useRef } from 'react';
import axios from 'axios';

const s = {
  app: { minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', color: '#1e293b' },
  container: { maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' },
  header: { textAlign: 'center', marginBottom: '2rem' },
  title: { fontSize: 28, fontWeight: 700, color: '#1e293b', marginBottom: 8 },
  subtitle: { color: '#64748b', fontSize: 15 },
  layout: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 },
  sidebar: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.25rem', height: 'fit-content' },
  sideTitle: { fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' },
  uploadZone: { border: '2px dashed #cbd5e1', borderRadius: 10, padding: '2rem', textAlign: 'center', cursor: 'pointer', marginBottom: 16, transition: 'border-color 0.2s' },
  uploadIcon: { fontSize: 32, marginBottom: 8 },
  uploadText: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  docCard: (active) => ({ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 6, border: `1px solid ${active ? '#6366f1' : '#e2e8f0'}`, background: active ? '#f0f0ff' : '#fff' }),
  docName: { fontSize: 13, fontWeight: 500, color: '#1e293b', marginBottom: 2 },
  docMeta: { fontSize: 11, color: '#94a3b8' },
  main: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', minHeight: 500 },
  chatArea: { flex: 1, padding: '1.5rem', overflowY: 'auto', maxHeight: 500 },
  msgRow: (role) => ({ display: 'flex', justifyContent: role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 16 }),
  bubble: (role) => ({ maxWidth: '75%', padding: '10px 14px', borderRadius: role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: role === 'user' ? '#6366f1' : '#f1f5f9', color: role === 'user' ? '#fff' : '#1e293b', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }),
  inputRow: { borderTop: '1px solid #e2e8f0', padding: '1rem', display: 'flex', gap: 10 },
  input: { flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 24, fontSize: 14, outline: 'none', background: '#f8fafc' },
  sendBtn: { background: '#6366f1', color: '#fff', border: 'none', borderRadius: 24, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  empty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', padding: '3rem' },
  badge: { display: 'inline-block', fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f0f0ff', color: '#6366f1', marginLeft: 6 },
};

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const upload = async (file) => {
    if (!file || !file.name.endsWith('.pdf')) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await axios.post('/api/documents/upload', fd);
      setDocuments(prev => [...prev, data]);
      setActiveDoc(data);
      setMessages(prev => ({ ...prev, [data.id]: [{ role: 'assistant', content: `📄 **${data.filename}** loaded! ${data.page_count} pages, ${data.char_count.toLocaleString()} characters.\n\nAsk me anything about this document!` }] }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Upload failed');
    }
    setUploading(false);
  };

  const ask = async () => {
    if (!input.trim() || !activeDoc || loading) return;
    const q = input.trim();
    const docMessages = messages[activeDoc.id] || [];
    setMessages(prev => ({ ...prev, [activeDoc.id]: [...docMessages, { role: 'user', content: q }] }));
    setInput('');
    setLoading(true);
    try {
      const { data } = await axios.post(`/api/documents/${activeDoc.id}/ask`, { question: q });
      setMessages(prev => ({ ...prev, [activeDoc.id]: [...(prev[activeDoc.id] || []), { role: 'assistant', content: data.answer }] }));
    } catch (err) {
      setMessages(prev => ({ ...prev, [activeDoc.id]: [...(prev[activeDoc.id] || []), { role: 'assistant', content: 'Error: ' + (err.response?.data?.detail || err.message) }] }));
    }
    setLoading(false);
  };

  const handleDrop = (e) => { e.preventDefault(); upload(e.dataTransfer.files[0]); };
  const currentMessages = activeDoc ? (messages[activeDoc.id] || []) : [];

  return (
    <div style={s.app}>
      <div style={s.container}>
        <div style={s.header}>
          <h1 style={s.title}>PDF Intelligence</h1>
          <p style={s.subtitle}>Upload a PDF and ask questions — powered by AI</p>
        </div>
        <div style={s.layout}>
          <div style={s.sidebar}>
            <p style={s.sideTitle}>Documents</p>
            <div style={s.uploadZone} onClick={() => fileRef.current?.click()} onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
              <div style={s.uploadIcon}>📎</div>
              <p style={s.uploadText}>{uploading ? 'Uploading...' : 'Drop PDF here or click'}</p>
              <p style={{ fontSize: 11, color: '#cbd5e1' }}>Max 20MB</p>
            </div>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => upload(e.target.files[0])} />
            {documents.map(doc => (
              <div key={doc.id} style={s.docCard(activeDoc?.id === doc.id)} onClick={() => setActiveDoc(doc)}>
                <p style={s.docName}>📄 {doc.filename}</p>
                <p style={s.docMeta}>{doc.page_count} pages · {doc.char_count?.toLocaleString()} chars</p>
              </div>
            ))}
            {documents.length === 0 && <p style={{ fontSize: 12, color: '#cbd5e1', textAlign: 'center' }}>No documents yet</p>}
          </div>
          <div style={s.main}>
            {!activeDoc ? (
              <div style={s.empty}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📚</p>
                <p style={{ fontSize: 16, marginBottom: 4 }}>Upload a PDF to get started</p>
                <p style={{ fontSize: 13 }}>Ask questions, get summaries, find information</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{activeDoc.filename}</span>
                  <span style={s.badge}>{activeDoc.page_count} pages</span>
                </div>
                <div style={s.chatArea}>
                  {currentMessages.map((m, i) => (
                    <div key={i} style={s.msgRow(m.role)}>
                      <div style={s.bubble(m.role)}>{m.content}</div>
                    </div>
                  ))}
                  {loading && <div style={s.msgRow('assistant')}><div style={{ ...s.bubble('assistant'), color: '#94a3b8' }}>Analyzing document...</div></div>}
                </div>
                <div style={s.inputRow}>
                  <input style={s.input} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} placeholder="Ask anything about this document..." />
                  <button style={s.sendBtn} onClick={ask} disabled={loading}>Ask</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
